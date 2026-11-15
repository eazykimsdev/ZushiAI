export type ProviderId = 'openrouter' | 'gemini' | 'claude' | 'openai';

export interface ModelDefinition {
  id: string;
  name: string;
  provider: ProviderId;
  contextWindow: number;
  costPerMillionInputTokens: number; // in USD
  costPerMillionOutputTokens: number; // in USD
  recommended?: boolean;
  supportsImages?: boolean;
  description: string;
}

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  icon: string;
  keyHelpUrl: string;
  keyPlaceholder: string;
  defaultModel: string;
  models: ModelDefinition[];
}

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Any Model)',
    icon: 'Compass',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    models: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (via OpenRouter)',
        provider: 'openrouter',
        contextWindow: 200000,
        costPerMillionInputTokens: 3.00,
        costPerMillionOutputTokens: 15.00,
        recommended: true,
        supportsImages: true,
        description: 'Highest coding fidelity for complex Luau game architectures',
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3 (via OpenRouter)',
        provider: 'openrouter',
        contextWindow: 64000,
        costPerMillionInputTokens: 0.27,
        costPerMillionOutputTokens: 1.10,
        recommended: false,
        supportsImages: false,
        description: 'Ultra cost-effective, exceptional coding and logic skills',
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (via OpenRouter)',
        provider: 'openrouter',
        contextWindow: 1048576,
        costPerMillionInputTokens: 0.15,
        costPerMillionOutputTokens: 0.60,
        recommended: false,
        supportsImages: true,
        description: 'Fastest 1M context model for rapid code generation',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (via OpenRouter)',
        provider: 'openrouter',
        contextWindow: 128000,
        costPerMillionInputTokens: 2.50,
        costPerMillionOutputTokens: 10.00,
        recommended: false,
        supportsImages: true,
        description: 'Solid multi-modal reasoning and tool planning',
      },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'Sparkles',
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
    defaultModel: 'gemini-2.5-flash',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'gemini',
        contextWindow: 1048576,
        costPerMillionInputTokens: 0.15,
        costPerMillionOutputTokens: 0.60,
        recommended: true,
        supportsImages: true,
        description: 'Fastest, highly capable for Luau scripting, planning & iterations',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'gemini',
        contextWindow: 2097152,
        costPerMillionInputTokens: 1.25,
        costPerMillionOutputTokens: 5.00,
        recommended: false,
        supportsImages: true,
        description: 'Deep reasoning, complex game systems & architecture design',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'gemini',
        contextWindow: 1048576,
        costPerMillionInputTokens: 0.10,
        costPerMillionOutputTokens: 0.40,
        recommended: false,
        supportsImages: true,
        description: 'Ultra-low latency fallback model',
      },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Zap',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-api03-...',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        provider: 'claude',
        contextWindow: 200000,
        costPerMillionInputTokens: 3.00,
        costPerMillionOutputTokens: 15.00,
        recommended: false,
        supportsImages: true,
        description: 'Hybrid reasoning and state-of-the-art coding fidelity',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: 'claude',
        contextWindow: 200000,
        costPerMillionInputTokens: 0.80,
        costPerMillionOutputTokens: 4.00,
        recommended: false,
        supportsImages: false,
        description: 'Fast, lightweight agent helper for minor checks',
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: 'Bot',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-proj-...',
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        contextWindow: 128000,
        costPerMillionInputTokens: 2.50,
        costPerMillionOutputTokens: 10.00,
        recommended: false,
        supportsImages: true,
        description: 'Omni model for complex tool use and code generation',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        contextWindow: 128000,
        costPerMillionInputTokens: 0.15,
        costPerMillionOutputTokens: 0.60,
        recommended: false,
        supportsImages: true,
        description: 'Budget-friendly quick coding assistant',
      },
      {
        id: 'o3-mini',
        name: 'o3-mini',
        provider: 'openai',
        contextWindow: 200000,
        costPerMillionInputTokens: 1.10,
        costPerMillionOutputTokens: 4.40,
        recommended: false,
        supportsImages: false,
        description: 'Reasoning model for math & game simulation logic',
      },
    ],
  },
};

export function calculateEstimatedCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  for (const provider of Object.values(PROVIDERS)) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      const inputCost = (inputTokens / 1_000_000) * model.costPerMillionInputTokens;
      const outputCost = (outputTokens / 1_000_000) * model.costPerMillionOutputTokens;
      return +(inputCost + outputCost).toFixed(6);
    }
  }
  return +(((inputTokens + outputTokens) / 1_000_000) * 0.5).toFixed(6);
}
