const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const inferenceLatency = new client.Histogram({
  name: 'llm_inference_latency_ms',
  help: 'LLM inference latency in milliseconds',
  labelNames: ['provider', 'model', 'status'],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
  registers: [register],
});

const inferenceCounter = new client.Counter({
  name: 'llm_inference_total',
  help: 'Total LLM inference requests',
  labelNames: ['provider', 'model', 'status'],
  registers: [register],
});

const tokenUsage = new client.Counter({
  name: 'llm_tokens_total',
  help: 'Total tokens used',
  labelNames: ['provider', 'model', 'type'],
  registers: [register],
});

function recordInference({ provider, model, latencyMs, status, promptTokens = 0, completionTokens = 0 }) {
  inferenceLatency.labels(provider, model, status).observe(latencyMs);
  inferenceCounter.labels(provider, model, status).inc();
  if (promptTokens) tokenUsage.labels(provider, model, 'prompt').inc(promptTokens);
  if (completionTokens) tokenUsage.labels(provider, model, 'completion').inc(completionTokens);
}

module.exports = { register, recordInference };
