const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b/g, replacement: '[CARD]' },
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP]' },
  { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME]' },
];

function redact(text) {
  if (!text || typeof text !== 'string') return text;
  return PII_PATTERNS.reduce((acc, { pattern, replacement }) => acc.replace(pattern, replacement), text);
}

module.exports = { redact };
