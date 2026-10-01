import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processVedaAiServerRequest } from './src/server/aiBackend.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

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

      const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        body.geminiApiKey ||
        '';

      const result = await processVedaAiServerRequest({
        feature,
        prompt,
        message: prompt,
        systemPrompt,
        history,
        options,
        aiMultiProviders,
        defaultGeminiApiKey: geminiApiKey,
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

  if (!isProduction) {
    // In development mode: Mount Vite middleware on the same Express server on port 3000
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode: Serve static files from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Edu Veda Server running on port ${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Server startup failed:', err);
});
