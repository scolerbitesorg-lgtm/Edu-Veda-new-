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

import { fetchAppConfig } from './settings';
import { generateVedaAiEducationalResponse } from '../data/educationalKnowledge';
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

    // 1. Retrieve dynamic admin-managed configuration from Firestore
    let multiSettings: MultiAISettings | undefined;
    try {
      const config = await fetchAppConfig();
      if (config) {
        multiSettings = normalizeMultiAISettings(config);
      }
    } catch (e) {
      console.warn('[AI Client] Unable to load Firestore AI settings, backend defaults will be used:', e);
    }

    // 2. Call the secure backend AI endpoint
    try {
      const controller = new AbortController();
      // Allow adequate time for server-side multi-provider failover
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new DOMException('AI request timed out after 35s', 'TimeoutError'));
        } catch {
          controller.abort();
        }
      }, 35000);

      const response = await fetch('/api/veda-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: params.feature,
          prompt: cleanPrompt,
          message: cleanPrompt, // backwards compatibility
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
        if (payload && payload.success === true && payload.data) {
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

        if (payload?.success === false) {
          return {
            success: false,
            code: payload.code || 'AI_ERROR',
            message: payload.message || 'AI service is temporarily unavailable. Please try again later.',
          };
        }
      }
    } catch (err: any) {
      if (
        err?.name === 'AbortError' ||
        err?.name === 'TimeoutError' ||
        err?.message?.toLowerCase().includes('aborted')
      ) {
        console.warn('[AI Client] Request timeout/aborted, seamlessly utilizing pedagogical knowledge engine fallback.');
      } else {
        console.warn('[AI Client] Backend request issue, falling back to local engine:', err?.message || err);
      }
    }

    // 3. Graceful Pedagogical Knowledge Engine Fallback
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

    // 4. Clean error message without exposing backend internals
    return {
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily unavailable. Please try again later.',
    };
  }
}

export const aiClient = new AIClientService();
