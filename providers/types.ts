export type ProviderId = 'openrouter' | 'gemini' | 'claude' | 'openai';

export interface LiveModelInfo {
  id: string;
  name: string;
  contextLength?: number;
  costPerMillionInput?: number;
  costPerMillionOutput?: number;
  description?: string;
  recommended?: boolean;
}

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
  fallbackModels: LiveModelInfo[];
}

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Any Model)',
    icon: 'Compass',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
    defaultModel: 'deepseek/deepseek-chat',
    fallbackModels: [
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3 (Chat)',
        contextLength: 64000,
        costPerMillionInput: 0.27,
        costPerMillionOutput: 1.10,
        recommended: true,
        description: 'Fast, high-fidelity reasoning & Luau scripting at ultra-low cost',
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextLength: 1048576,
        costPerMillionInput: 0.15,
        costPerMillionOutput: 0.60,
        recommended: true,
        description: 'Fast 1M context engine for rapid code iterations',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        contextLength: 200000,
        costPerMillionInput: 3.00,
        costPerMillionOutput: 15.00,
        recommended: false,
        description: 'Exceptional architectural precision for game mechanics',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        contextLength: 128000,
        costPerMillionInput: 2.50,
        costPerMillionOutput: 10.00,
        recommended: false,
        description: 'Omni model for complex reasoning and planning',
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
    fallbackModels: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextLength: 1048576,
        costPerMillionInput: 0.15,
        costPerMillionOutput: 0.60,
        recommended: true,
        description: 'Fastest 1M context model for Luau scripting and planning',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        contextLength: 2097152,
        costPerMillionInput: 1.25,
        costPerMillionOutput: 5.00,
        recommended: false,
        description: 'Deep reasoning for complex multi-module game architectures',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        contextLength: 1048576,
        costPerMillionInput: 0.10,
        costPerMillionOutput: 0.40,
        recommended: false,
        description: 'Ultra-low latency fallback engine',
      },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Zap',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-api03-...',
    defaultModel: 'claude-3-5-sonnet-20241022',
    fallbackModels: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextLength: 200000,
        costPerMillionInput: 3.00,
        costPerMillionOutput: 15.00,
        recommended: true,
        description: 'State of the art coding and logic reasoning',
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
    fallbackModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextLength: 128000,
        costPerMillionInput: 2.50,
        costPerMillionOutput: 10.00,
        recommended: true,
        description: 'Omni model for complex tool use and code generation',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextLength: 128000,
        costPerMillionInput: 0.15,
        costPerMillionOutput: 0.60,
        recommended: false,
        description: 'Budget-friendly quick coding assistant',
      },
    ],
  },
};

export function calculateEstimatedCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  let rateIn = 1.0;
  let rateOut = 3.0;

  if (modelId.includes('claude-3.7') || modelId.includes('claude-3-7')) {
    rateIn = 3.0;
    rateOut = 15.0;
  } else if (modelId.includes('claude-3.5') || modelId.includes('claude-3-5')) {
    rateIn = 3.0;
    rateOut = 15.0;
  } else if (modelId.includes('deepseek')) {
    rateIn = 0.27;
    rateOut = 1.10;
  } else if (modelId.includes('flash')) {
    rateIn = 0.15;
    rateOut = 0.60;
  } else if (modelId.includes('pro')) {
    rateIn = 1.25;
    rateOut = 5.00;
  } else if (modelId.includes('gpt-4o-mini')) {
    rateIn = 0.15;
    rateOut = 0.60;
  } else if (modelId.includes('gpt-4o')) {
    rateIn = 2.50;
    rateOut = 10.00;
  }

  const costIn = (inputTokens / 1_000_000) * rateIn;
  const costOut = (outputTokens / 1_000_000) * rateOut;
  return +((costIn + costOut).toFixed(6));
}
