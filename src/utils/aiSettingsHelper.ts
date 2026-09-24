import type { MultiAISettings, AIProviderConfig } from '../types/index.js';

/**
 * Normalizes any format in which an Admin Panel might save AI configuration in Firestore.
 * Handles:
 * 1. Full MultiAISettings object (aiMultiProviders)
 * 2. Nested sub-objects (aiSettings, aiConfig, aiProviders, providers)
 * 3. Flat keys:
 *    - groqApiKey, groqKey, groq_api_key, groqModel
 *    - openrouterApiKey, openRouterApiKey, openRouterKey, openrouterKey, openrouter_api_key
 *    - geminiApiKey, geminiKey, gemini_api_key, geminiModel
 *    - openaiApiKey, openAiApiKey, openAiKey, openaiKey, openai_api_key, openaiModel
 *    - anthropicApiKey, claudeApiKey, anthropicKey, anthropic_api_key, anthropicModel
 *    - aiApiKey, apiKey, aiProvider, aiModel
 * 4. Priority ordering:
 *    Automatically puts providers with active API keys at the FRONT of activeOrder.
 */
export function normalizeMultiAISettings(rawConfig: any): MultiAISettings {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return {
      enableAutoFailover: true,
      activeOrder: ['openrouter', 'groq', 'gemini', 'openai', 'anthropic'],
    };
  }

  // 1. Gather all possible sub-sources that an Admin panel might write to
  const sources = [
    rawConfig.aiMultiProviders,
    rawConfig.aiSettings,
    rawConfig.aiConfig,
    rawConfig.aiProviders,
    rawConfig.providers,
    rawConfig.settings,
    rawConfig,
  ].filter(s => s && typeof s === 'object');

  // Helper to find a string value across sources
  const findValue = (...keys: string[]): string | undefined => {
    for (const src of sources) {
      for (const k of keys) {
        const val = src[k];
        if (typeof val === 'string' && val.trim()) {
          return val.trim();
        }
      }
    }
    return undefined;
  };

  // Helper to extract a provider config
  const extractProvider = (
    providerName: 'groq' | 'openrouter' | 'gemini' | 'openai' | 'anthropic',
    keyAliases: string[],
    modelAliases: string[],
    defaultModel: string
  ): AIProviderConfig | undefined => {
    let obj: any = undefined;
    for (const src of sources) {
      if (src[providerName] && typeof src[providerName] === 'object') {
        obj = src[providerName];
        break;
      }
    }

    const apiKey =
      (typeof obj?.apiKey === 'string' && obj.apiKey.trim()) ||
      (typeof obj?.key === 'string' && obj.key.trim()) ||
      findValue(...keyAliases);

    if (!apiKey) {
      return undefined;
    }

    const model =
      (typeof obj?.model === 'string' && obj.model.trim()) ||
      findValue(...modelAliases) ||
      defaultModel;

    const enabled = obj?.enabled !== false;

    return {
      apiKey,
      model,
      enabled,
    };
  };

  let groq = extractProvider(
    'groq',
    ['groqApiKey', 'groqKey', 'groq_api_key', 'groq_key', 'groqAdminKey'],
    ['groqModel', 'groq_model'],
    'llama3-8b-8192'
  );

  let openrouter = extractProvider(
    'openrouter',
    [
      'openrouterApiKey',
      'openRouterApiKey',
      'openRouterKey',
      'openrouterKey',
      'openrouter_api_key',
      'open_router_api_key',
      'openRouterAdminKey',
    ],
    ['openrouterModel', 'openRouterModel', 'openrouter_model'],
    'meta-llama/llama-3.3-70b-instruct'
  );

  let gemini = extractProvider(
    'gemini',
    ['geminiApiKey', 'geminiKey', 'gemini_api_key', 'gemini_key', 'geminiAdminKey'],
    ['geminiModel', 'gemini_model'],
    'gemini-3.6-flash'
  );

  let openai = extractProvider(
    'openai',
    ['openaiApiKey', 'openAiApiKey', 'openAiKey', 'openaiKey', 'openai_api_key', 'open_ai_api_key'],
    ['openaiModel', 'openAiModel', 'openai_model'],
    'gpt-4o-mini'
  );

  let anthropic = extractProvider(
    'anthropic',
    ['anthropicApiKey', 'claudeApiKey', 'anthropicKey', 'claudeKey', 'anthropic_api_key'],
    ['anthropicModel', 'claudeModel', 'anthropic_model'],
    'claude-3-5-haiku-20241022'
  );

  // Generic key matching if Admin saved a single API key field
  const genericKey = findValue('aiApiKey', 'aiKey', 'apiKey', 'api_key', 'adminAiKey');
  const genericProvider = findValue('aiProvider', 'provider', 'selectedProvider')?.toLowerCase();
  const genericModel = findValue('aiModel', 'model', 'selectedModel');

  if (genericKey) {
    if (genericProvider === 'groq' || genericKey.startsWith('gsk_')) {
      groq = groq || { apiKey: genericKey, model: genericModel || 'llama3-8b-8192', enabled: true };
    } else if (genericProvider === 'openrouter' || genericKey.startsWith('sk-or-')) {
      openrouter = openrouter || {
        apiKey: genericKey,
        model: genericModel || 'meta-llama/llama-3.3-70b-instruct',
        enabled: true,
      };
    } else if (genericProvider === 'gemini' || genericKey.startsWith('AIza') || genericKey.startsWith('AQ.')) {
      gemini = gemini || { apiKey: genericKey, model: genericModel || 'gemini-3.6-flash', enabled: true };
    } else if (genericProvider === 'openai' || genericKey.startsWith('sk-proj-') || genericKey.startsWith('sk-admin-')) {
      openai = openai || { apiKey: genericKey, model: genericModel || 'gpt-4o-mini', enabled: true };
    } else if (genericProvider === 'anthropic' || genericKey.startsWith('sk-ant-')) {
      anthropic = anthropic || {
        apiKey: genericKey,
        model: genericModel || 'claude-3-5-haiku-20241022',
        enabled: true,
      };
    }
  }

  // Calculate activeOrder prioritizing providers with valid API keys
  let userActiveOrder: string[] = [];
  if (Array.isArray(rawConfig.activeOrder) && rawConfig.activeOrder.length > 0) {
    userActiveOrder = rawConfig.activeOrder.map((s: any) => String(s).toLowerCase().trim());
  } else if (Array.isArray(rawConfig.aiMultiProviders?.activeOrder)) {
    userActiveOrder = rawConfig.aiMultiProviders.activeOrder.map((s: any) => String(s).toLowerCase().trim());
  }

  const configuredWithKeys: string[] = [];
  if (openrouter?.apiKey && openrouter.enabled) configuredWithKeys.push('openrouter');
  if (groq?.apiKey && groq.enabled) configuredWithKeys.push('groq');
  if (gemini?.apiKey && gemini.enabled) configuredWithKeys.push('gemini');
  if (openai?.apiKey && openai.enabled) configuredWithKeys.push('openai');
  if (anthropic?.apiKey && anthropic.enabled) configuredWithKeys.push('anthropic');

  const defaultBaseOrder = ['openrouter', 'groq', 'gemini', 'openai', 'anthropic'];
  const baseOrder = userActiveOrder.length > 0 ? userActiveOrder : defaultBaseOrder;

  const activeOrder = [
    ...configuredWithKeys,
    ...baseOrder.filter(p => !configuredWithKeys.includes(p)),
  ];

  return {
    enableAutoFailover:
      rawConfig.enableAutoFailover !== false && rawConfig.aiMultiProviders?.enableAutoFailover !== false,
    activeOrder,
    groq,
    openrouter,
    gemini,
    openai,
    anthropic,
  };
}
