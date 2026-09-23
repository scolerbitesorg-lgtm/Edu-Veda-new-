import { GoogleGenAI } from '@google/genai';
import { generateVedaAiEducationalResponse } from '../src/data/educationalKnowledge.js';

export default async function handler(req: any, res: any) {
  // CORS headers for all environments & preview deployments
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
    res.status(405).json({ error: 'Method not allowed' });
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

    const userMessage = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userMessage) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'edu-veda-app',
            },
          },
        });

        const formattedContents = [
          ...history.slice(-6).map((msg: { role: string; text: string }) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          })),
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: formattedContents,
          config: {
            systemInstruction:
              'You are Veda AI, an intelligent, empathetic, and encouraging 24x7 bilingual educational mentor for students. Help students understand academic concepts in Hindi and English with crystal clear clarity. Provide structured bullet points, clear step-by-step explanations, real-world examples, relevant formulas, key exam takeaways, and mnemonic tips.',
          },
        });

        const replyText = response?.text || '';
        if (replyText.trim()) {
          res.status(200).json({ configured: true, reply: replyText.trim() });
          return;
        }
      } catch (geminiError) {
        console.warn('Vercel serverless Gemini API notice:', geminiError);
      }
    }

    // High-yield educational fallback
    const educationalReply = generateVedaAiEducationalResponse(userMessage);
    res.status(200).json({ configured: !!apiKey, reply: educationalReply });
  } catch (err) {
    console.error('Veda AI handler error:', err);
    const fallback = generateVedaAiEducationalResponse('Edu Veda Study Guide');
    res.status(200).json({ configured: false, reply: fallback });
  }
}
