const { REDIS_URL } = require('../config');
const InferenceLog = require('../models/InferenceLog');
const { redact } = require('./piiRedaction');
const logger = require('./logger');

let logQueue = null;

async function persistLog(data) {
  try {
    const log = new InferenceLog({
      ...data,
      inputPreview: redact(data.inputPreview),
      outputPreview: redact(data.outputPreview),
    });
    await log.save();
  } catch (err) {
    logger.error('Failed to persist inference log', { error: err.message, requestId: data.requestId });
  }
}

// Only init Bull if Redis is reachable
async function initQueue() {
  try {
    const net = require('net');
    const url = new URL(REDIS_URL);
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: url.hostname, port: url.port || 6379 });
      socket.setTimeout(1000);
      socket.on('connect', () => { socket.destroy(); resolve(); });
      socket.on('error', reject);
      socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
    });

    const Bull = require('bull');
    logQueue = new Bull('inference-logs', REDIS_URL);
    logQueue.process(async (job) => { await persistLog(job.data); });
    logQueue.on('failed', (job, err) => logger.error('Log queue job failed', { error: err.message }));
    logger.info('Redis queue connected, using event-based ingestion');
  } catch {
    logger.info('Redis not available, using direct DB writes for log ingestion');
  }
}

initQueue();

async function enqueueLog(logData) {
  if (logQueue) {
    try {
      await logQueue.add(logData, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
      return;
    } catch {
      // fall through to direct write
    }
  }
  await persistLog(logData);
}

module.exports = { enqueueLog, logQueue };
