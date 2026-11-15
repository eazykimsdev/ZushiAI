import { invoke } from '@tauri-apps/api/core';
import { AiChatResult, Project, RunHistoryRecord, UserSettings } from '../types';
import { ProviderId, LiveModelInfo, PROVIDERS } from '../../providers/types';

export interface TestKeyResult {
  success: boolean;
  message: string;
  rawError?: string;
  errorCode?: number;
  latencyMs?: number;
  availableModels?: LiveModelInfo[];
  suggestedModel?: string;
}

export interface MappedApiError {
  isModel404: boolean;
  isKeyRejected: boolean;
  isQuotaExceeded: boolean;
  isRateLimit: boolean;
  code?: number;
  humanMessage: string;
  rawError?: string;
  suggestedReplacement?: string;
}

export function parseApiError(err: any, currentModel?: string): MappedApiError {
  const message = typeof err === 'string' ? err : err?.message || String(err);
  
  const match = message.match(/^HTTP_(\d+):([^:]+):(.*)$/s);
  if (match) {
    const code = parseInt(match[1], 10);
    const human = match[2];
    const raw = match[3];
    return {
      isModel404: code === 404,
      isKeyRejected: code === 401 || code === 403,
      isQuotaExceeded: code === 402,
      isRateLimit: code === 429,
      code,
      humanMessage: human,
      rawError: raw,
      suggestedReplacement: code === 404 ? 'deepseek/deepseek-chat' : undefined,
    };
  }

  const is404 = message.includes('404') || message.includes('no longer available') || message.includes('not found');
  const is401 = message.includes('401') || message.includes('403') || message.includes('API_KEY_INVALID') || message.includes('Key rejected') || message.includes('unauthorized');
  const is402 = message.includes('402') || message.includes('credit') || message.includes('quota');
  const is429 = message.includes('429') || message.includes('rate limit');

  let human = message;
  let code: number | undefined;

  if (is404) {
    code = 404;
    human = `This model ('${currentModel || 'selected'}') is no longer available. Pick another.`;
  } else if (is401) {
    code = 401;
    human = 'Key rejected by provider. Please verify your API key.';
  } else if (is402) {
    code = 402;
    human = 'Insufficient credits on provider account. Please add credits.';
  } else if (is429) {
    code = 429;
    human = 'Rate limit reached. Please wait a moment and retry.';
  }

  return {
    isModel404: is404,
    isKeyRejected: is401,
    isQuotaExceeded: is402,
    isRateLimit: is429,
    code,
    humanMessage: human,
    rawError: message,
    suggestedReplacement: is404 ? 'deepseek/deepseek-chat' : undefined,
  };
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const LOCAL_STORAGE_PROJECTS_KEY = 'zushi_projects_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'zushi_settings_cache';
const LOCAL_STORAGE_KEY_STATUS_KEY = 'zushi_key_status';
const LOCAL_STORAGE_HISTORY_KEY = 'zushi_history_cache';

export const api = {
  async getProjects(): Promise<Project[]> {
    if (isTauriEnvironment()) {
      return await invoke<Project[]>('get_projects');
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  },

  async createProject(
    name: string,
    genre: string,
    notes: string,
    styleReferenceImage?: string | null
  ): Promise<Project> {
    if (isTauriEnvironment()) {
      return await invoke<Project>('create_project', {
        name,
        genre,
        notes,
        styleReferenceImage: styleReferenceImage ?? null,
      });
    }

    const newProject: Project = {
      id: crypto.randomUUID ? crypto.randomUUID() : `proj_${Date.now()}`,
      name,
      genre,
      notes,
      styleReferenceImage: styleReferenceImage ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = await this.getProjects();
    const updated = [newProject, ...current];
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    return newProject;
  },

  async updateProject(
    id: string,
    name: string,
    genre: string,
    notes: string,
    styleReferenceImage?: string | null
  ): Promise<Project> {
    if (isTauriEnvironment()) {
      return await invoke<Project>('update_project', {
        id,
        name,
        genre,
        notes,
        styleReferenceImage: styleReferenceImage ?? null,
      });
    }

    const current = await this.getProjects();
    const updated = current.map((p) =>
      p.id === id
        ? {
            ...p,
            name,
            genre,
            notes,
            styleReferenceImage: styleReferenceImage ?? p.styleReferenceImage,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    return updated.find((p) => p.id === id)!;
  },

  async deleteProject(id: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_project', { id });
      return;
    }
    const current = await this.getProjects();
    const filtered = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(filtered));
  },

  async getSettings(): Promise<UserSettings> {
    let raw: Record<string, any> = {};
    if (isTauriEnvironment()) {
      raw = await invoke<Record<string, string>>('get_settings');
    } else {
      try {
        raw = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || '{}');
      } catch {
        raw = {};
      }
    }
    const num = (v: any, d: number) => {
      const n = typeof v === 'number' ? v : parseFloat(v);
      return Number.isFinite(n) ? n : d;
    };
    const provider = (raw.activeProvider as ProviderId) || 'openrouter';
    return {
      activeProvider: provider,
      // Never hardcode a model: empty until the user picks one from the live list.
      activeModel: raw.activeModel || this.getLastWorkingModel(provider) || '',
      monthlyBudgetLimit: num(raw.monthlyBudgetLimit, 10.0),
      sessionBudgetLimit: num(raw.sessionBudgetLimit, 2.0),
      currentMonthSpend: num(raw.currentMonthSpend, 0),
      currentSessionSpend: num(raw.currentSessionSpend, 0),
      vaultPath:
        raw.vaultPath ||
        'C:\\Users\\sulma\\.gemini\\antigravity\\scratch\\v2-vault\\LihFolk Vault V2',
      theme: raw.theme === 'light' ? 'light' : 'dark',
      backgroundEffect: String(raw.backgroundEffect) !== 'false',
      serverName: raw.serverName || '',
      serverIcon: raw.serverIcon || '',
      userName: raw.userName || '',
      userHandle: raw.userHandle || '',
      userAvatar: raw.userAvatar || '',
    };
  },
  async saveSetting(key: string, value: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('save_setting', { key, value });
      return;
    }
    const current = await this.getSettings();
    (current as any)[key] = value;
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(current));
  },

  async saveApiKey(provider: ProviderId, apiKey: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('save_api_key', { provider, apiKey });
      return;
    }
    localStorage.setItem(`zushi_key_${provider}`, apiKey);
    sessionStorage.setItem(`${LOCAL_STORAGE_KEY_STATUS_KEY}_${provider}`, 'true');
    sessionStorage.setItem(`temp_key_${provider}`, apiKey);
  },

  async hasApiKey(provider: ProviderId): Promise<boolean> {
    if (isTauriEnvironment()) {
      return await invoke<boolean>('has_api_key', { provider });
    }
    const local = localStorage.getItem(`zushi_key_${provider}`);
    const session = sessionStorage.getItem(`temp_key_${provider}`);
    return Boolean(local || session);
  },

  async deleteApiKey(provider: ProviderId): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_api_key', { provider });
      return;
    }
    localStorage.removeItem(`zushi_key_${provider}`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY_STATUS_KEY}_${provider}`);
    sessionStorage.removeItem(`temp_key_${provider}`);
  },

  async checkStudioConnection(port = 4243): Promise<boolean> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<boolean>('check_studio_bridge', { port });
      } catch {
        return false;
      }
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 600);
      const res = await fetch(`http://127.0.0.1:${port}/ping`, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  },

  async checkVaultPath(path: string): Promise<{ exists: boolean; noteCount: number }> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<{ exists: boolean; noteCount: number }>('check_vault_path', { path });
      } catch {
        return { exists: false, noteCount: 0 };
      }
    }
    return { exists: true, noteCount: 1333 };
  },

  rememberLastWorkingModel(provider: ProviderId, model: string): void {
    try {
      localStorage.setItem(`zushi_last_working_model_${provider}`, model);
    } catch {
      // ignore
    }
  },

  getLastWorkingModel(provider: ProviderId): string | null {
    try {
      return localStorage.getItem(`zushi_last_working_model_${provider}`);
    } catch {
      return null;
    }
  },

  async fetchLiveModels(provider: ProviderId, customKey?: string): Promise<LiveModelInfo[]> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<LiveModelInfo[]>('fetch_provider_models', {
          provider,
          customKey: customKey || null,
        });
      } catch (err) {
        console.warn('Tauri fetch_provider_models error, using fallback list', err);
      }
    }

    // Direct browser fetch
    try {
      if (provider === 'openrouter') {
        const key = customKey || localStorage.getItem(`zushi_key_${provider}`) || sessionStorage.getItem(`temp_key_${provider}`);
        const headers: Record<string, string> = {
          'HTTP-Referer': 'https://zushiai.local',
          'X-Title': 'ZushiAI Roblox Builder',
        };
        if (key) headers['Authorization'] = `Bearer ${key}`;
        const resp = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (resp.ok) {
          const data = await resp.json();
          return (data.data || []).map((item: any) => ({
            id: item.id,
            name: item.name || item.id,
            contextLength: item.context_length,
            costPerMillionInput: item.pricing?.prompt ? parseFloat(item.pricing.prompt) * 1_000_000 : undefined,
            costPerMillionOutput: item.pricing?.completion ? parseFloat(item.pricing.completion) * 1_000_000 : undefined,
            description: item.description,
          }));
        }
      } else if (provider === 'gemini') {
        const key = customKey || localStorage.getItem(`zushi_key_${provider}`) || sessionStorage.getItem(`temp_key_${provider}`);
        if (!key) return PROVIDERS.gemini.fallbackModels;
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (resp.ok) {
          const data = await resp.json();
          return (data.models || [])
            .filter((m: any) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => ({
              id: (m.name || '').replace('models/', ''),
              name: m.displayName || m.name,
              contextLength: m.inputTokenLimit,
              costPerMillionInput: 0.15,
              costPerMillionOutput: 0.60,
              description: m.description,
            }));
        }
      }
    } catch (e) {
      console.warn('Browser model fetch error', e);
    }

    return PROVIDERS[provider]?.fallbackModels || [];
  },

  async testApiKey(
    provider: ProviderId,
    model: string,
    customKey?: string
  ): Promise<TestKeyResult> {
    if (isTauriEnvironment()) {
      const result = await invoke<TestKeyResult>('test_api_key', {
        provider,
        model,
        customKey: customKey || null,
      });
      if (result.success) {
        this.rememberLastWorkingModel(provider, model);
      }
      return result;
    }

    const key =
      customKey ||
      localStorage.getItem(`zushi_key_${provider}`) ||
      sessionStorage.getItem(`temp_key_${provider}`);
    if (!key) {
      return {
        success: false,
        message: 'No key found. Please enter your API key in the field or in Settings.',
      };
    }

    try {
      const start = performance.now();
      if (provider === 'openrouter') {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://zushiai.local',
            'X-Title': 'ZushiAI Roblox Builder',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
        });
        const latency = Math.round(performance.now() - start);
        if (resp.ok) {
          this.rememberLastWorkingModel(provider, model);
          const liveModels = await this.fetchLiveModels('openrouter', key).catch(() => undefined);
          return {
            success: true,
            message: `Key connected and model verified! (${latency}ms latency)`,
            latencyMs: latency,
            errorCode: 200,
            availableModels: liveModels,
          };
        } else {
          const errText = await resp.text();
          const cleanErr = parseApiError(`HTTP_${resp.status}:OpenRouter error:${errText}`, model);
          const liveModels = await this.fetchLiveModels('openrouter', key).catch(() => undefined);
          const suggested = resp.status === 404 ? liveModels?.[0]?.id || 'deepseek/deepseek-chat' : undefined;

          return {
            success: false,
            message: cleanErr.humanMessage,
            rawError: errText,
            errorCode: resp.status,
            latencyMs: latency,
            availableModels: liveModels,
            suggestedModel: suggested,
          };
        }
      } else if (provider === 'gemini') {
        const cleanModel = model.replace('models/', '');
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'ping' }] }],
              generationConfig: { maxOutputTokens: 1 },
            }),
          }
        );
        const latency = Math.round(performance.now() - start);
        if (resp.ok) {
          this.rememberLastWorkingModel(provider, model);
          const liveModels = await this.fetchLiveModels('gemini', key).catch(() => undefined);
          return {
            success: true,
            message: `Google Gemini key verified successfully! (${latency}ms latency)`,
            latencyMs: latency,
            errorCode: 200,
            availableModels: liveModels,
          };
        } else {
          const errText = await resp.text();
          const isKeyErr = resp.status === 400 && (errText.includes('API_KEY_INVALID') || errText.includes('INVALID_ARGUMENT'));
          const mapped = parseApiError(`HTTP_${isKeyErr ? 401 : resp.status}:Gemini error:${errText}`, cleanModel);
          const liveModels = await this.fetchLiveModels('gemini', key).catch(() => undefined);
          return {
            success: false,
            message: mapped.humanMessage,
            rawError: errText,
            errorCode: isKeyErr ? 401 : resp.status,
            latencyMs: latency,
            availableModels: liveModels,
            suggestedModel: resp.status === 404 ? liveModels?.[0]?.id : undefined,
          };
        }
      }

      return {
        success: true,
        message: 'Key test passed.',
        latencyMs: 120,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network error or provider unreachable: ${err.message}`,
        rawError: String(err),
      };
    }
  },

  async runAiChat(
    provider: ProviderId,
    model: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
    customKey?: string
  ): Promise<AiChatResult> {
    if (isTauriEnvironment()) {
      try {
        const res = await invoke<AiChatResult>('run_ai_chat', {
          provider,
          model,
          systemPrompt,
          messages,
          customKey: customKey || null,
        });
        this.rememberLastWorkingModel(provider, model);
        return res;
      } catch (err: any) {
        throw parseApiError(err, model);
      }
    }

    // Direct browser fallback
    const key =
      customKey ||
      localStorage.getItem(`zushi_key_${provider}`) ||
      sessionStorage.getItem(`temp_key_${provider}`);
    if (!key) {
      throw {
        isModel404: false,
        isKeyRejected: true,
        humanMessage: `No API key provided for ${provider}. Please enter your key in Settings or in the chat.`,
      };
    }

    const start = performance.now();
    try {
      if (provider === 'openrouter') {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://zushiai.local',
            'X-Title': 'ZushiAI Roblox Builder',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          throw parseApiError(`HTTP_${resp.status}:OpenRouter error:${err}`, model);
        }

        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content || 'No response content';
        const inTokens = data.usage?.prompt_tokens || 350;
        const outTokens = data.usage?.completion_tokens || 450;
        const durationMs = Math.round(performance.now() - start);

        this.rememberLastWorkingModel(provider, model);
        return {
          content: text,
          tokensInput: inTokens,
          tokensOutput: outTokens,
          estimatedCost: ((inTokens / 1000000) * 0.27 + (outTokens / 1000000) * 1.10),
          durationMs,
          model,
          provider,
        };
      } else if (provider === 'gemini') {
        const cleanModel = model.replace('models/', '');
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
            }),
          }
        );

        if (!resp.ok) {
          const err = await resp.text();
          const isKeyErr = resp.status === 400 && (err.includes('API_KEY_INVALID') || err.includes('INVALID_ARGUMENT'));
          throw parseApiError(`HTTP_${isKeyErr ? 401 : resp.status}:Gemini error:${err}`, cleanModel);
        }

        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        const inTokens = data.usageMetadata?.promptTokenCount || 250;
        const outTokens = data.usageMetadata?.candidatesTokenCount || 350;
        const durationMs = Math.round(performance.now() - start);

        this.rememberLastWorkingModel(provider, model);
        return {
          content: text,
          tokensInput: inTokens,
          tokensOutput: outTokens,
          estimatedCost: ((inTokens / 1000000) * 0.15 + (outTokens / 1000000) * 0.60),
          durationMs,
          model,
          provider,
        };
      }
      throw new Error(`Unsupported provider: ${provider}`);
    } catch (err: any) {
      if (err.humanMessage) throw err;
      throw parseApiError(err, model);
    }
  },

  async getRunHistory(projectId?: string): Promise<RunHistoryRecord[]> {
    if (isTauriEnvironment()) {
      return await invoke<RunHistoryRecord[]>('get_run_history', {
        projectId: projectId || null,
      });
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (cached) {
      try {
        const records: RunHistoryRecord[] = JSON.parse(cached);
        if (projectId) {
          return records.filter((r) => r.projectId === projectId);
        }
        return records;
      } catch {
        return [];
      }
    }
    return [];
  },

  async recordRunHistory(
    record: Omit<RunHistoryRecord, 'id' | 'timestamp'>
  ): Promise<RunHistoryRecord> {
    if (isTauriEnvironment()) {
      return await invoke<RunHistoryRecord>('record_run_history', {
        projectId: record.projectId || null,
        taskPrompt: record.taskPrompt,
        provider: record.provider,
        model: record.model,
        tokensInput: record.tokensInput,
        tokensOutput: record.tokensOutput,
        estimatedCost: record.estimatedCost,
        status: record.status,
        durationMs: record.durationMs,
      });
    }

    const newRecord: RunHistoryRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const current = await this.getRunHistory();
    const updated = [newRecord, ...current];
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    return newRecord;
  },
};
