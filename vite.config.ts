import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { processVedaAiServerRequest } from './src/server/aiBackend.ts';

function vedaAiApiPlugin(): Plugin {
  return {
    name: 'veda-ai-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/veda-ai', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(
            JSON.stringify({
              success: false,
              code: 'METHOD_NOT_ALLOWED',
              message: 'Method not allowed',
            })
          );
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          try {
            const data = JSON.parse(body || '{}');
            const feature = data.feature || 'ai-tutor';
            const prompt = (data.prompt || data.message || '').trim();
            const systemPrompt = data.systemPrompt;
            const history = Array.isArray(data.history) ? data.history : [];
            const options = data.options || {};
            const aiMultiProviders = data.aiMultiProviders ? { ...data, ...data.aiMultiProviders } : data;

            if (!prompt) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  success: false,
                  code: 'INVALID_INPUT',
                  message: 'Prompt cannot be empty',
                })
              );
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

            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[Vite Server /api/veda-ai error]:', err?.message || err);
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: false,
                code: 'SERVICE_UNAVAILABLE',
                message: 'AI service is temporarily unavailable. Please try again later.',
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), vedaAiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
