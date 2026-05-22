const express = require('express');
const InferenceLog = require('../models/InferenceLog');
const { register } = require('../services/metrics');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const { from, to, provider } = req.query;
    const match = {};
    if (from || to) {
      match.timestamp = {};
      if (from) match.timestamp.$gte = new Date(from);
      if (to) match.timestamp.$lte = new Date(to);
    }
    if (provider) match.provider = provider;

    const [latencyStats, throughput, errorRate, tokenStats, providerBreakdown] = await Promise.all([
      // Latency stats - compute percentiles manually from sorted values
      InferenceLog.aggregate([
        { $match: Object.keys(match).length ? match : { latencyMs: { $exists: true } } },
        { $group: { _id: null, avgLatency: { $avg: '$latencyMs' }, latencies: { $push: '$latencyMs' }, count: { $sum: 1 } } },
        { $project: {
          avgLatency: 1,
          count: 1,
          p95Index: { $floor: { $multiply: [0.95, '$count'] } },
          p99Index: { $floor: { $multiply: [0.99, '$count'] } },
          p50Index: { $floor: { $multiply: [0.50, '$count'] } },
          sortedLatencies: { $sortArray: { input: '$latencies', sortBy: 1 } },
        }},
        { $project: {
          avgLatency: 1,
          count: 1,
          p50: { $arrayElemAt: ['$sortedLatencies', '$p50Index'] },
          p95: { $arrayElemAt: ['$sortedLatencies', '$p95Index'] },
          p99: { $arrayElemAt: ['$sortedLatencies', '$p99Index'] },
        }},
      ]),
      // Throughput over time (per hour)
      InferenceLog.aggregate([
        { $match: Object.keys(match).length ? match : { timestamp: { $exists: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%dT%H:00:00Z', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 48 },
      ]),
      // Error rate
      InferenceLog.aggregate([
        { $match: Object.keys(match).length ? match : { status: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      // Token usage
      InferenceLog.aggregate([
        { $match: Object.keys(match).length ? match : { totalTokens: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalPromptTokens: { $sum: '$promptTokens' },
            totalCompletionTokens: { $sum: '$completionTokens' },
            totalTokens: { $sum: '$totalTokens' },
          },
        },
      ]),
      // Per-provider breakdown
      InferenceLog.aggregate([
        { $match: Object.keys(match).length ? match : { provider: { $exists: true } } },
        {
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            avgLatency: { $avg: '$latencyMs' },
            totalTokens: { $sum: '$totalTokens' },
          },
        },
      ]),
    ]);

    res.json({
      latency: latencyStats[0] || {},
      throughput,
      errorRate,
      tokens: tokenStats[0] || {},
      providerBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prometheus metrics endpoint
router.get('/prometheus', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
