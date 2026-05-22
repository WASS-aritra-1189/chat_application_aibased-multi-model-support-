const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const { chat } = require('../sdk/llmClient');
const { MAX_CONTEXT_MESSAGES } = require('../config');

const router = express.Router();

const PROVIDER_MODELS = {
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  openrouter: ['deepseek/deepseek-v4-flash:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'],
};

router.get('/providers', (req, res) => res.json(PROVIDER_MODELS));

// Start or resume a conversation
router.post('/conversations', async (req, res) => {
  try {
    const { provider, model, sessionId } = req.body;
    if (sessionId) {
      const existing = await Conversation.findOne({ sessionId });
      if (existing) return res.json(existing);
    }
    const conversation = new Conversation({
      sessionId: uuidv4(),
      provider,
      model,
      messages: [{ role: 'system', content: 'You are a helpful AI assistant.' }],
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({}, { messages: 0 }).sort({ updatedAt: -1 }).limit(50);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single conversation
router.get('/conversations/:sessionId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel conversation
router.patch('/conversations/:sessionId/cancel', async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message (streaming)
router.post('/conversations/:sessionId/messages', async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    if (conversation.status === 'cancelled') return res.status(400).json({ error: 'Conversation cancelled' });

    conversation.messages.push({ role: 'user', content });

    // Keep short context window
    const systemMsg = conversation.messages.find(m => m.role === 'system');
    const nonSystem = conversation.messages.filter(m => m.role !== 'system');
    const contextMessages = [
      ...(systemMsg ? [systemMsg] : []),
      ...nonSystem.slice(-MAX_CONTEXT_MESSAGES),
    ];

    // Update title from first user message
    if (nonSystem.length === 1) {
      conversation.title = content.slice(0, 50);
    }

    await chat({
      provider: conversation.provider,
      model: conversation.model,
      messages: contextMessages.map(m => ({ role: m.role, content: m.content })),
      sessionId: conversation.sessionId,
      stream: true,
      res,
    });

    // After stream ends, capture assistant response from SSE isn't possible here
    // We'll handle saving via a separate endpoint called by frontend
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// Save assistant message after stream completes
router.post('/conversations/:sessionId/save', async (req, res) => {
  try {
    const { userContent, assistantContent } = req.body;
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) return res.status(404).json({ error: 'Not found' });

    // Avoid duplicate user messages
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg?.role !== 'user' || lastMsg?.content !== userContent) {
      conversation.messages.push({ role: 'user', content: userContent });
    }
    conversation.messages.push({ role: 'assistant', content: assistantContent });
    await conversation.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
