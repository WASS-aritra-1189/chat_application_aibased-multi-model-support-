// Grok uses OpenAI-compatible API
const OpenAI = require('openai');
const { GROK_API_KEY } = require('../../config');

const client = new OpenAI({
  apiKey: GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function chat({ model, messages }) {
  const res = await client.chat.completions.create({ model, messages });
  const choice = res.choices[0];
  return {
    content: choice.message.content,
    usage: {
      promptTokens: res.usage?.prompt_tokens,
      completionTokens: res.usage?.completion_tokens,
      totalTokens: res.usage?.total_tokens,
    },
  };
}

async function streamChat({ model, messages, res }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.chat.completions.create({ model, messages, stream: true });
  let outputPreview = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      outputPreview += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
  return { outputPreview: outputPreview.slice(0, 200) };
}

module.exports = { chat, streamChat };
