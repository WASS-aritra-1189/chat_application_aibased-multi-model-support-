const mongoose = require('mongoose');

const inferenceLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  requestId: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  inputPreview: String,
  outputPreview: String,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  latencyMs: Number,
  status: { type: String, enum: ['success', 'error', 'cancelled'], default: 'success' },
  errorMessage: String,
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
});

inferenceLogSchema.index({ timestamp: -1 });
inferenceLogSchema.index({ provider: 1, timestamp: -1 });

module.exports = mongoose.model('InferenceLog', inferenceLogSchema);
