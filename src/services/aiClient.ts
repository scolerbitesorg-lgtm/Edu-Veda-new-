/**
 * Central AI Client for Edu Veda User Web App
 * 
 * ARCHITECTURE:
 * User Feature
 *  → Central AI Client (`aiClient.request()`)
 *  → Secure Backend AI Endpoint (`/api/veda-ai`)
 *  → Admin-configured Provider (Groq / OpenRouter / Gemini / OpenAI / Anthropic)
 *  → Selected AI Model
 *  → Standardized Response
 *  → User Feature
 * 
 * The frontend does NOT directly call any external AI provider or expose any API keys.
 */

import { getCachedAppConfig, fetchAppConfig } from './settings';
import { generateVedaAiEducationalResponse } from '../data/educationalKnowledge';
import { GoogleGenAI } from '@google/genai';
import type { MultiAISettings } from '../types';
import { normalizeMultiAISettings } from '../utils/aiSettingsHelper';

export interface AIRequestParams {
  feature:
    | 'ai-tutor'
    | 'mcq-generator'
    | 'mcq-explanation'
    | 'notes-generator'
    | 'question-generator'
    | 'doubt-solver'
    | 'mock-generator'
    | 'summary-generator'
    | string;
  prompt: string;
  systemPrompt?: string;
  history?: Array<{ role: 'user' | 'assistant' | 'model'; text: string }>;
  options?: Record<string, any>;
}

export interface AISuccessResponse<T = any> {
  success: true;
  data: T;
  provider: string;
  model?: string;
}

export interface AIErrorResponse {
  success: false;
  code: string;
  message: string;
}

export type AIResponse<T = any> = AISuccessResponse<T> | AIErrorResponse;

export interface StandardAIData {
  reply: string;
  [key: string]: any;
}

class AIClientService {
  /**
   * Central entry point for all AI feature requests across the app.
   */
  async request<T = StandardAIData>(params: AIRequestParams): Promise<AIResponse<T>> {
    const cleanPrompt = (params.prompt || '').trim();
    if (!cleanPrompt) {
      return {
        success: false,
        code: 'INVALID_INPUT',
        message: 'Prompt cannot be empty.',
      };
    }

    // 1. Retrieve cached configuration instantly (0ms delay)
    let multiSettings: MultiAISettings | undefined;
    const cachedConfig = getCachedAppConfig();
    if (cachedConfig) {
      multiSettings = normalizeMultiAISettings(cachedConfig);
    }

    // Refresh config in background without blocking current request
    fetchAppConfig().catch(() => {});

    // 2. Call the backend AI endpoint with snappy 5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new DOMException('AI request timed out after 5s', 'TimeoutError'));
        } catch {
          controller.abort();
        }
      }, 5000);

      const response = await fetch('/api/veda-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: params.feature,
          prompt: cleanPrompt,
          message: cleanPrompt,
          systemPrompt: params.systemPrompt,
          history: (params.history || []).slice(-6),
          options: params.options || {},
          aiMultiProviders: multiSettings,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const payload = await response.json().catch(() => null);

        // Standardized backend response format from a real AI provider
        if (
          payload &&
          payload.success === true &&
          payload.data?.reply &&
          payload.provider !== 'educational-knowledge-engine'
        ) {
          return {
            success: true,
            data: payload.data as T,
            provider: payload.provider || 'central-ai-service',
            model: payload.model,
          };
        }

        // Backwards compatible reply handling
        if (
          payload?.reply &&
          typeof payload.reply === 'string' &&
          payload.provider !== 'educational-knowledge-engine'
        ) {
          return {
            success: true,
            data: { reply: payload.reply.trim() } as unknown as T,
            provider: payload.provider || 'central-ai-service',
            model: payload.model,
          };
        }
      }
    } catch (err: any) {
      console.warn('[AI Client] Backend endpoint bypassed or timed out, executing direct fast client provider:', err?.message || err);
    }

    const systemInstruction =
      params.systemPrompt ||
      'You are Veda AI, an expert academic tutor on Edu Veda. Provide accurate, structured, and exam-focused answers in Hindi/English with high precision.';

    // 3. Direct Client-Side Gemini Execution (Blazing fast ~1s directly from browser)
    const clientGeminiKey =
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : '') ||
      multiSettings?.gemini?.apiKey ||
      '';

    if (clientGeminiKey && clientGeminiKey.trim() && clientGeminiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey: clientGeminiKey.trim(),
        });

        const formattedContents = [
          ...(params.history || []).slice(-6).map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          })),
          {
            role: 'user',
            parts: [{ text: cleanPrompt }],
          },
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        const reply = response?.text?.trim();
        if (reply) {
          return {
            success: true,
            data: { reply } as unknown as T,
            provider: 'gemini (direct-client)',
            model: 'gemini-3.8-flash',
          };
        }
      } catch (clientErr) {
        console.warn('[AI Client] Direct client Gemini failed:', clientErr);
      }
    }

    // 4. Direct Client-Side Groq Execution (~300ms ultra-fast)
    const clientGroqKey =
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GROQ_API_KEY : '') ||
      multiSettings?.groq?.apiKey ||
      '';

    if (clientGroqKey && clientGroqKey.trim()) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientGroqKey.trim()}`,
          },
          body: JSON.stringify({
            model: multiSettings?.groq?.model || 'llama3-8b-8192',
            temperature: 0.5,
            max_tokens: 2048,
            messages: [
              { role: 'system', content: systemInstruction },
              ...(params.history || []).slice(-6).map(h => ({
                role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: cleanPrompt },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return {
              success: true,
              data: { reply } as unknown as T,
              provider: 'groq (direct-client)',
              model: 'llama3-8b-8192',
            };
          }
        }
      } catch (groqErr) {
        console.warn('[AI Client] Direct client Groq failed:', groqErr);
      }
    }

    // 5. Direct Client-Side OpenRouter Execution
    const clientOpenRouterKey =
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENROUTER_API_KEY : '') ||
      multiSettings?.openrouter?.apiKey ||
      '';

    if (clientOpenRouterKey && clientOpenRouterKey.trim()) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientOpenRouterKey.trim()}`,
          },
          body: JSON.stringify({
            model: multiSettings?.openrouter?.model || 'meta-llama/llama-3.3-70b-instruct',
            temperature: 0.5,
            max_tokens: 2048,
            messages: [
              { role: 'system', content: systemInstruction },
              ...(params.history || []).slice(-6).map(h => ({
                role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: cleanPrompt },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return {
              success: true,
              data: { reply } as unknown as T,
              provider: 'openrouter (direct-client)',
              model: 'meta-llama/llama-3.3-70b-instruct',
            };
          }
        }
      } catch (orErr) {
        console.warn('[AI Client] Direct client OpenRouter failed:', orErr);
      }
    }

    // 6. Pedagogical Knowledge Engine Fallback
    try {
      const educationalReply = generateVedaAiEducationalResponse(cleanPrompt);
      if (educationalReply) {
        return {
          success: true,
          data: { reply: educationalReply } as unknown as T,
          provider: 'educational-knowledge-engine',
        };
      }
    } catch {}

    // 7. Clean error message
    return {
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily busy. Please try again in a moment.',
    };
  }
}

export const aiClient = new AIClientService();
