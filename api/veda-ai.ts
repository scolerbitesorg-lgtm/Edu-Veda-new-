import { processVedaAiServerRequest } from '../src/server/aiBackend.js';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

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
}
