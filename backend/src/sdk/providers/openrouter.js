// OpenRouter uses OpenAI-compatible API with access to 100+ models
const OpenAI = require('openai');
const { OPENROUTER_API_KEY } = require('../../config');

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Chatbot',
  },
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

  const stream = await client.chat.completions.create({ model, messages, stream: true, stream_options: { include_usage: true } });
  let outputPreview = '';
  let usage = {};

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      outputPreview += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    if (chunk.usage) {
      usage = {
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
        totalTokens: chunk.usage.total_tokens,
      };
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
  return { outputPreview: outputPreview.slice(0, 200), usage };
}

module.exports = { chat, streamChat };
