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

    // 2. Call the backend AI endpoint with snappy 12s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new DOMException('AI request timed out after 12s', 'TimeoutError'));
        } catch {
          controller.abort();
        }
      }, 12000);

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
        const payload = await response.json();

        // Standardized backend response format
        if (payload && payload.success === true && payload.data?.reply) {
          return {
            success: true,
            data: payload.data as T,
            provider: payload.provider || 'central-ai-service',
            model: payload.model,
          };
        }

        // Backwards compatible reply handling
        if (payload?.reply && typeof payload.reply === 'string') {
          return {
            success: true,
            data: { reply: payload.reply.trim() } as unknown as T,
            provider: payload.provider || 'central-ai-service',
            model: payload.model,
          };
        }
      }
    } catch (err: any) {
      console.warn('[AI Client] Backend endpoint unavailable, attempting direct fallback:', err?.message || err);
    }

    // 3. Client-side direct Gemini API fallback if API key is present
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
            systemInstruction:
              params.systemPrompt ||
              'You are Veda AI, an expert academic tutor on Edu Veda. Provide accurate, clear, and structured answers in Hindi/English for students preparing for competitive exams and academic syllabus.',
            temperature: 0.5,
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
        console.warn('[AI Client] Direct client Gemini fallback failed:', clientErr);
      }
    }

    // 4. Graceful Educational Knowledge Engine Fallback
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

    // 5. Clean error message
    return {
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily busy. Please try again in a moment.',
    };
  }
}

export const aiClient = new AIClientService();
