const express = require('express');
const InferenceLog = require('../models/InferenceLog');
const { body, validationResult } = require('express-validator');
const { enqueueLog } = require('../services/logQueue');

const router = express.Router();

// Ingestion endpoint - receives logs from SDK
router.post(
  '/ingest',
  [
    body('sessionId').notEmpty(),
    body('requestId').notEmpty(),
    body('provider').notEmpty(),
    body('model').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      await enqueueLog(req.body);
      res.status(202).json({ accepted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Query logs
router.get('/', async (req, res) => {
  try {
    const { sessionId, provider, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (provider) filter.provider = provider;

    const logs = await InferenceLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await InferenceLog.countDocuments(filter);
    res.json({ logs, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
