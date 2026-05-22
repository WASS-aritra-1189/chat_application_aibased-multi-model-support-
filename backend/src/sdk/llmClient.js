const { v4: uuidv4 } = require('uuid');
const { enqueueLog } = require('../services/logQueue');
const { recordInference } = require('../services/metrics');
const logger = require('../services/logger');

const PROVIDERS = {
  openai: require('./providers/openai'),
  google: require('./providers/google'),
  deepseek: require('./providers/deepseek'),
  grok: require('./providers/grok'),
  groq: require('./providers/groq'),
  openrouter: require('./providers/openrouter'),
};

async function chat({ provider, model, messages, sessionId, stream = false, res = null }) {
  const requestId = uuidv4();
  const startTime = Date.now();
  const providerImpl = PROVIDERS[provider];

  if (!providerImpl) throw new Error(`Unknown provider: ${provider}`);

  const inputPreview = messages[messages.length - 1]?.content?.slice(0, 200);
  let status = 'success';
  let errorMessage;
  let usage = {};
  let outputPreview = '';

  try {
    if (stream && res) {
      const result = await providerImpl.streamChat({ model, messages, res });
      outputPreview = result.outputPreview || '';
      usage = result.usage || {};
    } else {
      const result = await providerImpl.chat({ model, messages });
      outputPreview = result.content?.slice(0, 200);
      usage = result.usage || {};
      return result;
    }
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    logger.error('LLM call failed', { provider, model, requestId, error: err.message });
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;
    recordInference({ provider, model, latencyMs, status, ...usage });
    await enqueueLog({
      sessionId,
      requestId,
      provider,
      model,
      inputPreview,
      outputPreview,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      latencyMs,
      status,
      errorMessage,
      timestamp: new Date(),
    });
  }
}

module.exports = { chat };
