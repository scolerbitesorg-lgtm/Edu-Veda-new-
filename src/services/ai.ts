import { GoogleGenAI } from '@google/genai';
import { fetchAppConfig } from './settings';
import { generateVedaAiEducationalResponse } from '../data/educationalKnowledge';
import type { MultiAISettings, AIProviderConfig } from '../types';

export interface VedaAiResponse {
  configured: boolean;
  reply: string;
  provider?: string;
  model?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT =
  'You are Veda AI, an intelligent, empathetic, and encouraging 24x7 bilingual educational mentor for students. Help students understand academic concepts in Hindi and English with crystal clear clarity. Provide structured bullet points, clear step-by-step explanations, real-world examples, relevant formulas, key exam takeaways, and mnemonic tips. Keep answers easy to read on mobile devices.';

/**
 * Executes a Gemini API completion with timeout
 */
async function callGemini(
  config: AIProviderConfig,
  message: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) throw new Error('Gemini API key is empty');

  const modelName = config.model?.trim() || 'gemini-2.5-flash';

  const ai = new GoogleGenAI({ apiKey });

  const formattedContents = [
    ...history.slice(-6).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: formattedContents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  const reply = response?.text?.trim();
  if (!reply) throw new Error('Empty response from Gemini');
  return reply;
}

/**
 * Executes an OpenAI Chat Completion API call with timeout
 */
async function callOpenAI(
  config: AIProviderConfig,
  message: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) throw new Error('OpenAI API key is empty');

  const modelName = config.model?.trim() || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.slice(-6).map(h => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
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
      throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response from OpenAI');
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes a Groq Fast Cloud Inference API call with timeout
 */
async function callGroq(
  config: AIProviderConfig,
  message: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) throw new Error('Groq API key is empty');

  const modelName = config.model?.trim() || 'llama-3.3-70b-versatile';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.slice(-6).map(h => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
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
      throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response from Groq');
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes an Anthropic Claude Messages API call with timeout
 */
async function callAnthropic(
  config: AIProviderConfig,
  message: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) throw new Error('Anthropic API key is empty');

  const modelName = config.model?.trim() || 'claude-3-5-haiku-20241022';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          ...history.slice(-6).map(h => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
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
      throw new Error(`Anthropic API error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const reply = data?.content?.[0]?.text?.trim();
    if (!reply) throw new Error('Empty response from Anthropic');
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main Multi-AI Failover Dispatcher:
 * Evaluates the dynamic Firestore configuration under `appSettings/general` -> `aiMultiProviders`.
 * Executes providers in configured order (`activeOrder`) with automatic failover to subsequent providers
 * upon error/quota limits, finally falling back to the built-in pedagogical knowledge engine.
 */
export async function askVedaAi(
  message: string,
  history: ChatHistoryItem[] = []
): Promise<VedaAiResponse> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return {
      configured: true,
      reply: 'Please ask a study question or topic you would like explained.',
      provider: 'built-in',
    };
  }

  // Retrieve dynamic configuration from Firestore appSettings/general
  let multiSettings: MultiAISettings | null = null;
  let legacyApiKey: string = '';

  try {
    const config = await fetchAppConfig();
    if (config?.aiMultiProviders && typeof config.aiMultiProviders === 'object') {
      multiSettings = config.aiMultiProviders;
    }
    if (config?.geminiApiKey && typeof config.geminiApiKey === 'string') {
      legacyApiKey = config.geminiApiKey.trim();
    } else if (config?.aiApiKey && typeof config.aiApiKey === 'string') {
      legacyApiKey = config.aiApiKey.trim();
    }
  } catch (e) {
    console.warn('Could not read Firestore AI settings, trying defaults:', e);
  }

  // Fallback to client environment variable if no key configured in Firestore
  if (!legacyApiKey && !multiSettings) {
    const envKey =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
    if (envKey && typeof envKey === 'string' && envKey !== 'MY_GEMINI_API_KEY') {
      legacyApiKey = envKey.trim();
    }
  }

  // 1. Process Multi-AI Provider Failover if configured
  if (multiSettings) {
    const isAutoFailover = multiSettings.enableAutoFailover !== false;
    let order = Array.isArray(multiSettings.activeOrder) && multiSettings.activeOrder.length > 0
      ? multiSettings.activeOrder
      : ['gemini', 'openai', 'groq', 'anthropic'];

    // If auto-failover is disabled, only use the first provider in order
    const providersToTry = isAutoFailover ? order : [order[0]];

    for (const providerKey of providersToTry) {
      const lower = (providerKey || '').toLowerCase().trim();
      const provConfig: AIProviderConfig | undefined = (multiSettings as any)[lower];

      if (!provConfig || provConfig.enabled === false || !provConfig.apiKey?.trim()) {
        continue;
      }

      try {
        let reply = '';
        if (lower === 'gemini') {
          reply = await callGemini(provConfig, cleanMessage, history);
        } else if (lower === 'openai') {
          reply = await callOpenAI(provConfig, cleanMessage, history);
        } else if (lower === 'groq') {
          reply = await callGroq(provConfig, cleanMessage, history);
        } else if (lower === 'anthropic') {
          reply = await callAnthropic(provConfig, cleanMessage, history);
        }

        if (reply) {
          return {
            configured: true,
            reply,
            provider: lower,
            model: provConfig.model,
          };
        }
      } catch (providerError) {
        console.warn(`[Multi-AI Failover] Provider '${lower}' failed, checking next:`, providerError);
        if (!isAutoFailover) {
          break; // Stop immediately if auto-failover is not enabled
        }
      }
    }
  }

  // 2. Fallback to Legacy Gemini Key if Multi-AI wasn't successful
  if (legacyApiKey) {
    try {
      const reply = await callGemini(
        { apiKey: legacyApiKey, model: 'gemini-2.5-flash', enabled: true },
        cleanMessage,
        history
      );
      if (reply) {
        return {
          configured: true,
          reply,
          provider: 'gemini (legacy)',
          model: 'gemini-2.5-flash',
        };
      }
    } catch (legacyErr) {
      console.warn('Legacy Gemini API fallback notice:', legacyErr);
    }
  }

  // 3. Built-in high-yield pedagogical knowledge engine
  const directReply = generateVedaAiEducationalResponse(cleanMessage);
  return {
    configured: !!(multiSettings || legacyApiKey),
    reply: directReply,
    provider: 'educational-knowledge-engine',
  };
}
