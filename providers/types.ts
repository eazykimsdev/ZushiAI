export type ProviderId = 'openrouter' | 'gemini' | 'claude' | 'openai';

/** A model as reported live by the provider. Nothing in the app hardcodes model IDs. */
export interface LiveModelInfo {
  id: string;
  name: string;
  contextLength?: number;
  costPerMillionInput?: number;
  costPerMillionOutput?: number;
  description?: string;
  recommended?: boolean;
}

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  icon: string;
  keyHelpUrl: string;
  keyPlaceholder: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Any Model)',
    icon: 'Compass',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'Sparkles',
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Zap',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-api03-...',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: 'Bot',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-proj-...',
  },
};

/**
 * Cost from the provider's own live pricing. Returns null when the provider does not publish
 * prices for that model, so the UI can show tokens only instead of guessing.
 */
export function costFromLivePricing(
  model: LiveModelInfo | undefined,
  inputTokens: number,
  outputTokens: number
): number | null {
  if (!model || model.costPerMillionInput == null || model.costPerMillionOutput == null) return null;
  return +(
    (inputTokens / 1_000_000) * model.costPerMillionInput +
    (outputTokens / 1_000_000) * model.costPerMillionOutput
  ).toFixed(6);
}
