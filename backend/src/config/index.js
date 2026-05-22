require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://mongo:27017/ai_chatbot',
  REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  GROK_API_KEY: process.env.GROK_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  MAX_CONTEXT_MESSAGES: parseInt(process.env.MAX_CONTEXT_MESSAGES) || 10,
};
