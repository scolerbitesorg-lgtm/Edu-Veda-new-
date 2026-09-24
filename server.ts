import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processVedaAiServerRequest } from './src/server/aiBackend.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// API endpoint for Veda AI
app.post('/api/veda-ai', async (req, res) => {
  try {
    const body = req.body || {};
    const feature = body.feature || 'ai-tutor';
    const prompt = (body.prompt || body.message || '').trim();
    const systemPrompt = body.systemPrompt;
    const history = Array.isArray(body.history) ? body.history : [];
    const options = body.options || {};
    const aiMultiProviders = body.aiMultiProviders ? { ...body, ...body.aiMultiProviders } : body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'Prompt cannot be empty',
      });
      return;
    }

    const result = await processVedaAiServerRequest({
      feature,
      prompt,
      message: prompt,
      systemPrompt,
      history,
      options,
      aiMultiProviders,
      defaultGeminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
      defaultGroqApiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY,
      defaultOpenRouterApiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
    });

    res.status(200).json(result);
  } catch (err: any) {
    console.error('[Server Error /api/veda-ai]:', err?.message || err);
    res.status(200).json({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily unavailable. Please try again later.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Static assets from Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Edu Veda Server running on port ${PORT}`);
});
