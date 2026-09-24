import { GoogleGenAI } from '@google/genai';
import { generateVedaAiEducationalResponse } from '../data/educationalKnowledge.js';
import { normalizeMultiAISettings } from '../utils/aiSettingsHelper.js';

export interface MultiAISettings {
  enableAutoFailover?: boolean;
  activeOrder?: string[];
  groq?: AIProviderConfig;
  gemini?: AIProviderConfig;
  openai?: AIProviderConfig;
  anthropic?: AIProviderConfig;
  openrouter?: AIProviderConfig;
}

export interface AIProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  model?: string;
}

export interface StandardAIServerResponse {
  success: boolean;
  data?: {
    reply: string;
    [key: string]: any;
  };
  provider?: string;
  model?: string;
  code?: string;
  message?: string;
  // Backwards compatibility keys
  configured?: boolean;
  reply?: string;
}

// Server default fallback keys (Configured via Environment Variables or Admin Panel)
export const SERVER_DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
export const SERVER_DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
export const SERVER_DEFAULT_OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';

const FEATURE_SYSTEM_PROMPTS: Record<string, string> = {
  'ai-tutor':
    `You are "Veda AI", an expert personal academic mentor and doubt-solver on the Edu Veda learning platform.
Your primary mission is to provide accurate, clear, and high-scoring explanations to students preparing for competitive exams (UPSC, State PSC, SSC, UGC NET, Banking, Teaching, NEET/JEE, and School Boards).

Guidelines:
1. Always start directly with a crystal-clear, structured explanation.
2. Structure answers using bold headings, numbered steps, and concise bullet points.
3. Bilingual Support: If the question is in Hindi or Hinglish, respond with natural, easy-to-understand Hinglish or Hindi.
4. Accuracy & Facts: Cite exact Constitutional Articles, historical chronologies, scientific formulas, or standard definitions.
5. Provide a quick "💡 Key Takeaway / Exam Trick" at the end of complex questions.
6. Tone: Encouraging, respectful, disciplined, and academically rigorous.`,
  'mcq-generator':
    'You are an expert exam question creator on Edu Veda. Create accurate, challenging, syllabus-aligned multiple choice questions with 4 distinct options, unambiguous correct answer, and clear rationale.',
  'mcq-explanation':
    `You are Veda AI, master academic mentor explaining competitive exam MCQs.
Guidelines:
1. State the correct answer clearly.
2. Provide a structured, conceptual explanation of why the correct option is right.
3. Briefly highlight common traps or why other options are incorrect.
4. Cite relevant Articles, formulas, or chronological facts.
5. End with a "💡 Key Takeaway / Exam Trick" if applicable.`,
  'notes-generator':
    'You are an expert curriculum designer on Edu Veda. Generate structured, high-yield revision notes with core concept summaries, key formulas/dates/facts, and exam-focused takeaways.',
  'question-generator':
    'You are an academic test maker on Edu Veda. Generate high-yield practice questions with detailed solutions and marking criteria.',
  'doubt-solver':
    `You are Veda AI, an expert academic doubt-solver. Break down complex student doubts step-by-step with clear logic, formulas, and real-world analogies in Hindi/English with high academic accuracy.`,
  'mock-generator':
    'You are a standardized exam curator on Edu Veda. Design balanced mock test sections aligned with the latest exam syllabus and difficulty pattern.',
  'summary-generator':
    'You are an educational summarizer on Edu Veda. Condense study material into high-retention bullet points, mnemonics, and key formulas for rapid revision.',
};

const DEFAULT_SYSTEM_PROMPT = FEATURE_SYSTEM_PROMPTS['ai-tutor'];

/**
 * Sanitizes any deprecated/obsolete model names
 * into modern, fast, high-performance replacements.
 */
export function sanitizeModelName(provider: string, rawModel?: string): string {
  const p = (provider || '').toLowerCase().trim();
  const m = (rawModel || '').trim();

  if (p === 'groq') {
    if (
      !m ||
      m.toLowerCase().includes('mixtral') ||
      m.toLowerCase().includes('8x7b') ||
      m.toLowerCase().includes('70b-versatile') ||
      m.toLowerCase().includes('llama2')
    ) {
      return 'llama3-8b-8192';
    }
    return m;
  }

  if (p === 'openrouter') {
    if (!m || m.toLowerCase().includes('mixtral') || m.toLowerCase().includes('8x7b')) {
      return 'meta-llama/llama-3.3-70b-instruct';
    }
    return m;
  }

  if (p === 'gemini') {
    // Current supported Google GenAI models (e.g. gemini-3.6-flash, gemini-3.7-flash, gemini-2.0-flash)
    if (
      !m ||
      m.toLowerCase().includes('1.5') ||
      m.toLowerCase().includes('2.5') ||
      m.toLowerCase().includes('1.0') ||
      m.toLowerCase().includes('flash-8b') ||
      m.toLowerCase() === 'gemini-pro' ||
      m.toLowerCase().includes('models/')
    ) {
      return 'gemini-3.6-flash';
    }
    return m;
  }

  if (p === 'openai') {
    if (!m || m === 'gpt-3.5-turbo') {
      return 'gpt-4o-mini';
    }
    return m;
  }

  if (p === 'anthropic') {
    if (!m) {
      return 'claude-3-5-haiku-20241022';
    }
    return m;
  }

  return m || 'default';
}

/**
 * Executes a Gemini API completion server-side with multi-model fallback (gemini-3.6-flash -> gemini-3.7-flash -> gemini-2.0-flash)
 */
async function executeGeminiServer(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
  history: Array<{ role: string; text: string }>
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('Gemini API key is empty');

  const safeModel = sanitizeModelName('gemini', modelName);

  const ai = new GoogleGenAI({
    apiKey: cleanKey,
    httpOptions: {
      headers: {
        'User-Agent': 'edu-veda-backend-service',
      },
    },
  });

  const formattedContents = [
    ...history.slice(-6).map(msg => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const candidateModels = [
    safeModel,
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-2.0-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const reply = response?.text?.trim();
      if (reply) return reply;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
        console.warn(`[Gemini Server] Model ${model} not available (${errMsg.slice(0, 100)}), trying next candidate...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed');
}

/**
 * Discovers and queries available Groq models dynamically
 */
async function executeGroqServer(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
  history: Array<{ role: string; text: string }>
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('Groq API key is empty');

  const safeModel = sanitizeModelName('groq', modelName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('Groq request timeout', 'TimeoutError'));
    } catch {
      controller.abort();
    }
  }, 15000);

  const candidateGroqModels = [
    safeModel,
    'llama3-8b-8192',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'llama3-70b-8192',
  ].filter((v, i, a) => a.indexOf(v) === i);

  try {
    for (const model of candidateGroqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
            'User-Agent': 'edu-veda-groq-proxy',
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 2048,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map(h => ({
                role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: message },
            ],
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data: any = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            clearTimeout(timeoutId);
            return reply;
          }
        } else if (res.status === 404 || res.status === 400) {
          console.warn(`[Groq Server] Model ${model} returned ${res.status}, checking next candidate...`);
          continue;
        } else {
          const errText = await res.text().catch(() => '');
          throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 100)}`);
        }
      } catch (innerErr: any) {
        if (innerErr?.message?.includes('Groq API error') || innerErr?.name === 'TimeoutError') {
          throw innerErr;
        }
        continue;
      }
    }

    throw new Error('All Groq model candidates failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes an OpenRouter API completion server-side with model fallback
 */
async function executeOpenRouterServer(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
  history: Array<{ role: string; text: string }>
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('OpenRouter API key is empty');

  const safeModel = sanitizeModelName('openrouter', modelName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('OpenRouter request timeout', 'TimeoutError'));
    } catch {
      controller.abort();
    }
  }, 18000);

  const candidateModels = [
    safeModel,
    'meta-llama/llama-3.3-70b-instruct',
    'google/gemini-2.0-flash-001',
    'mistralai/mistral-7b-instruct:free',
  ].filter((v, i, a) => a.indexOf(v) === i);

  try {
    for (const model of candidateModels) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
            'HTTP-Referer': 'https://edu-veda.app',
            'X-Title': 'Edu Veda Academic AI',
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 2048,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map(h => ({
                role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: message },
            ],
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data: any = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            clearTimeout(timeoutId);
            return reply;
          }
        } else if (res.status === 404) {
          continue;
        } else {
          const errText = await res.text().catch(() => '');
          throw new Error(`OpenRouter API error (${res.status}): ${errText.slice(0, 100)}`);
        }
      } catch (innerErr: any) {
        if (innerErr?.message?.includes('OpenRouter API error') || innerErr?.name === 'TimeoutError') {
          throw innerErr;
        }
        continue;
      }
    }

    throw new Error('All OpenRouter model candidates failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes an OpenAI API completion server-side
 */
async function executeOpenAIServer(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
  history: Array<{ role: string; text: string }>
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('OpenAI API key is empty');

  const safeModel = sanitizeModelName('openai', modelName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('OpenAI request timeout', 'TimeoutError'));
    } catch {
      controller.abort();
    }
  }, 15000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
        'User-Agent': 'edu-veda-openai-proxy',
      },
      body: JSON.stringify({
        model: safeModel,
        temperature: 0.7,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map(h => ({
            role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
            content: h.text,
          })),
          { role: 'user', content: message },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(
        `[OpenAI Server Diagnostics] Status ${res.status} on model ${safeModel}:`,
        errText.slice(0, 300)
      );
      throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data: any = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response from OpenAI');
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes an Anthropic API completion server-side
 */
async function executeAnthropicServer(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
  history: Array<{ role: string; text: string }>
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('Anthropic API key is empty');

  const safeModel = sanitizeModelName('anthropic', modelName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('Anthropic request timeout', 'TimeoutError'));
    } catch {
      controller.abort();
    }
  }, 15000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          ...history.slice(-6).map(h => ({
            role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
            content: h.text,
          })),
          { role: 'user', content: message },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(
        `[Anthropic Server Diagnostics] Status ${res.status} on model ${safeModel}:`,
        errText.slice(0, 300)
      );
      throw new Error(`Anthropic API error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data: any = await res.json();
    const reply = data?.content?.[0]?.text?.trim();
    if (!reply) throw new Error('Empty response from Anthropic');
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Master Server-Side Multi-AI Execution Engine
 * Evaluates feature identifier, system prompts, provider configuration, sanitized model names, rate limits, and failover order.
 */
export async function processVedaAiServerRequest(params: {
  feature?: string;
  prompt?: string;
  message?: string;
  systemPrompt?: string;
  history?: Array<{ role: string; text: string }>;
  options?: Record<string, any>;
  aiMultiProviders?: MultiAISettings;
  defaultGeminiApiKey?: string;
  defaultGroqApiKey?: string;
  defaultOpenRouterApiKey?: string;
}): Promise<StandardAIServerResponse> {
  const feature = (params.feature || 'ai-tutor').toLowerCase().trim();
  const cleanPrompt = (params.prompt || params.message || '').trim();
  const history = Array.isArray(params.history) ? params.history : [];

  if (!cleanPrompt) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      message: 'Prompt cannot be empty.',
    };
  }

  const systemInstruction =
    params.systemPrompt?.trim() || FEATURE_SYSTEM_PROMPTS[feature] || DEFAULT_SYSTEM_PROMPT;

  const rawInputSettings = params.aiMultiProviders || (params as any);
  const multiSettings = normalizeMultiAISettings(rawInputSettings);

  // 1. Process Multi-AI Configuration from Admin (OpenRouter, Groq, Gemini, OpenAI, Anthropic)
  if (multiSettings && typeof multiSettings === 'object') {
    const isAutoFailover = multiSettings.enableAutoFailover !== false;
    let order =
      Array.isArray(multiSettings.activeOrder) && multiSettings.activeOrder.length > 0
        ? multiSettings.activeOrder
        : ['openrouter', 'groq', 'gemini', 'openai', 'anthropic'];

    const providersToTry = isAutoFailover ? order : [order[0]];

    for (const providerKey of providersToTry) {
      const lower = (providerKey || '').toLowerCase().trim();
      const provConfig: AIProviderConfig | undefined = (multiSettings as any)[lower];

      if (!provConfig || provConfig.enabled === false || !provConfig.apiKey?.trim()) {
        continue;
      }

      const safeModel = sanitizeModelName(lower, provConfig.model);

      try {
        let reply = '';
        if (lower === 'openrouter') {
          reply = await executeOpenRouterServer(provConfig.apiKey, safeModel, systemInstruction, cleanPrompt, history);
        } else if (lower === 'gemini') {
          reply = await executeGeminiServer(provConfig.apiKey, safeModel, systemInstruction, cleanPrompt, history);
        } else if (lower === 'groq') {
          reply = await executeGroqServer(provConfig.apiKey, safeModel, systemInstruction, cleanPrompt, history);
        } else if (lower === 'openai') {
          reply = await executeOpenAIServer(provConfig.apiKey, safeModel, systemInstruction, cleanPrompt, history);
        } else if (lower === 'anthropic') {
          reply = await executeAnthropicServer(provConfig.apiKey, safeModel, systemInstruction, cleanPrompt, history);
        }

        if (reply && reply.trim()) {
          const trimmed = reply.trim();
          return {
            success: true,
            data: {
              reply: trimmed,
            },
            provider: lower,
            model: safeModel,
            configured: true,
            reply: trimmed,
          };
        }
      } catch (err: any) {
        const errStr = err?.message || String(err);
        if (
          errStr.includes('403') ||
          errStr.includes('PERMISSION_DENIED') ||
          errStr.includes('denied access') ||
          errStr.includes('401') ||
          errStr.includes('404')
        ) {
          // Quietly cascade to next available provider without error monitor alarms
          continue;
        }
        if (!isAutoFailover) {
          break;
        }
      }
    }
  }

  // 2. Fallback to OpenRouter (Env or Server Default Key)
  const openRouterKey =
    params.defaultOpenRouterApiKey ||
    (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY || process.env?.VITE_OPENROUTER_API_KEY : '') ||
    SERVER_DEFAULT_OPENROUTER_KEY;

  if (openRouterKey && openRouterKey.trim()) {
    try {
      const reply = await executeOpenRouterServer(
        openRouterKey.trim(),
        'meta-llama/llama-3.3-70b-instruct',
        systemInstruction,
        cleanPrompt,
        history
      );
      if (reply) {
        const trimmed = reply.trim();
        return {
          success: true,
          data: {
            reply: trimmed,
          },
          provider: 'openrouter (server-engine)',
          model: 'meta-llama/llama-3.3-70b-instruct',
          configured: true,
          reply: trimmed,
        };
      }
    } catch (e: any) {
      console.warn('[Server Diagnostics] OpenRouter attempt failed:', e?.message || e);
    }
  }

  // 3. Fallback to Gemini (Env or Server Default Key with gemini-3.6-flash / 3.7-flash)
  const serverGeminiKey =
    params.defaultGeminiApiKey ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY : '') ||
    SERVER_DEFAULT_GEMINI_KEY;

  if (serverGeminiKey && serverGeminiKey.trim() && serverGeminiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const reply = await executeGeminiServer(
        serverGeminiKey.trim(),
        'gemini-3.6-flash',
        systemInstruction,
        cleanPrompt,
        history
      );
      if (reply) {
        const trimmed = reply.trim();
        return {
          success: true,
          data: {
            reply: trimmed,
          },
          provider: 'gemini (server-engine)',
          model: 'gemini-3.6-flash',
          configured: true,
          reply: trimmed,
        };
      }
    } catch (e: any) {
      console.warn('[Server Diagnostics] Gemini attempt failed:', e?.message || e);
    }
  }

  // 4. Fallback to Groq (Env or Server Default Key with multi-model candidates)
  const groqKey =
    params.defaultGroqApiKey ||
    (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY || process.env?.VITE_GROQ_API_KEY : '') ||
    SERVER_DEFAULT_GROQ_KEY;

  if (groqKey && groqKey.trim()) {
    try {
      const reply = await executeGroqServer(
        groqKey.trim(),
        'llama3-8b-8192',
        systemInstruction,
        cleanPrompt,
        history
      );
      if (reply) {
        const trimmed = reply.trim();
        return {
          success: true,
          data: {
            reply: trimmed,
          },
          provider: 'groq (server-engine)',
          model: 'llama3-8b-8192',
          configured: true,
          reply: trimmed,
        };
      }
    } catch (e: any) {
      console.warn('[Server Diagnostics] Groq attempt failed:', e?.message || e);
    }
  }

  // 5. Pedagogical Knowledge Engine Fallback
  const fallbackReply = generateVedaAiEducationalResponse(cleanPrompt);
  if (fallbackReply) {
    return {
      success: true,
      data: {
        reply: fallbackReply,
      },
      provider: 'educational-knowledge-engine',
      configured: true,
      reply: fallbackReply,
    };
  }

  return {
    success: false,
    code: 'SERVICE_UNAVAILABLE',
    message: 'AI service is temporarily unavailable. Please try again later.',
  };
}
