const Anthropic = require('@anthropic-ai/sdk');
const { ANTHROPIC_API_KEY } = require('../../config');

const client = new Anthropic.default({ apiKey: ANTHROPIC_API_KEY });

function formatMessages(messages) {
  const system = messages.find(m => m.role === 'system')?.content;
  const filtered = messages.filter(m => m.role !== 'system');
  return { system, messages: filtered };
}

async function chat({ model, messages }) {
  const { system, messages: msgs } = formatMessages(messages);
  const res = await client.messages.create({ model, max_tokens: 2048, system, messages: msgs });
  return {
    content: res.content[0]?.text,
    usage: {
      promptTokens: res.usage?.input_tokens,
      completionTokens: res.usage?.output_tokens,
      totalTokens: (res.usage?.input_tokens || 0) + (res.usage?.output_tokens || 0),
    },
  };
}

async function streamChat({ model, messages, res }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { system, messages: msgs } = formatMessages(messages);
  const stream = client.messages.stream({ model, max_tokens: 2048, system, messages: msgs });
  let outputPreview = '';

  stream.on('text', (text) => {
    outputPreview += text;
    res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
  });

  await stream.finalMessage();
  res.write('data: [DONE]\n\n');
  res.end();
  return { outputPreview: outputPreview.slice(0, 200) };
}

module.exports = { chat, streamChat };
