const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const importRoutes = require('./routes/importRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const clientUrl = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.trim().replace(/\/$/, '')
  : 'http://localhost:3000';

app.use(cors({
  origin: [clientUrl, `${clientUrl}/`],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  const key = req.query.apiKey || req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmProvider: detectProvider(key),
  });
});

// Routes
app.use('/api', importRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.message === 'Only CSV files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Detect which LLM provider is configured
function detectProvider(customApiKey) {
  if (customApiKey) {
    const trimmed = customApiKey.trim();
    if (trimmed.startsWith('AIzaSy')) return 'gemini';
    if (trimmed.startsWith('sk-ant')) return 'anthropic';
    if (trimmed.startsWith('sk-')) return 'openai';
  }
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GROQ_API_KEY) return 'groq';
  return 'none';
}

app.listen(PORT, () => {
  const provider = detectProvider();
  console.log(`\n🚀 CRM CSV Server running on http://localhost:${PORT}`);
  console.log(`🤖 LLM Provider: ${provider === 'none' ? '⚠️  No API key configured!' : provider.toUpperCase()}`);
  console.log(`📡 Accepting requests from: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n`);
});

module.exports = app;
