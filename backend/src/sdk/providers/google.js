const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GOOGLE_API_KEY } = require('../../config');

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

function toGeminiHistory(messages) {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
}

async function chat({ model, messages }) {
  const geminiModel = genAI.getGenerativeModel({ model }, { apiVersion: 'v1beta' });
  const history = toGeminiHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;
  const chatSession = geminiModel.startChat({ history });
  const result = await chatSession.sendMessage(lastMsg);
  const text = result.response.text();
  return { content: text, usage: {} };
}

async function streamChat({ model, messages, res }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const geminiModel = genAI.getGenerativeModel({ model }, { apiVersion: 'v1beta' });
  const history = toGeminiHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;
  const chatSession = geminiModel.startChat({ history });
  const result = await chatSession.sendMessageStream(lastMsg);
  let outputPreview = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    outputPreview += text;
    res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
  return { outputPreview: outputPreview.slice(0, 200) };
}

module.exports = { chat, streamChat };
