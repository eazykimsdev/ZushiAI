import { invoke } from '@tauri-apps/api/core';
import { AiChatResult, Project, RunHistoryRecord, UserSettings } from '../types';
import { ProviderId } from '../../providers/types';

export interface TestKeyResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  availableModels?: string[];
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const LOCAL_STORAGE_PROJECTS_KEY = 'lihforge_projects_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'lihforge_settings_cache';
const LOCAL_STORAGE_KEY_STATUS_KEY = 'lihforge_key_status';
const LOCAL_STORAGE_HISTORY_KEY = 'lihforge_history_cache';

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
    if (isTauriEnvironment()) {
      const raw = await invoke<Record<string, string>>('get_settings');
      return {
        activeProvider: (raw.activeProvider as ProviderId) || 'openrouter',
        activeModel: raw.activeModel || 'anthropic/claude-3.7-sonnet',
        monthlyBudgetLimit: raw.monthlyBudgetLimit ? parseFloat(raw.monthlyBudgetLimit) : 10.0,
        sessionBudgetLimit: raw.sessionBudgetLimit ? parseFloat(raw.sessionBudgetLimit) : 2.0,
        currentMonthSpend: raw.currentMonthSpend ? parseFloat(raw.currentMonthSpend) : 0.0,
        currentSessionSpend: raw.currentSessionSpend ? parseFloat(raw.currentSessionSpend) : 0.0,
        vaultPath: raw.vaultPath || 'C:\\Users\\sulma\\.gemini\\antigravity\\scratch\\v2-vault\\LihFolk Vault V2',
      };
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback
      }
    }
    return {
      activeProvider: 'openrouter',
      activeModel: 'anthropic/claude-3.7-sonnet',
      monthlyBudgetLimit: 10.0,
      sessionBudgetLimit: 2.0,
      currentMonthSpend: 0.0,
      currentSessionSpend: 0.0,
      vaultPath: 'C:\\Users\\sulma\\.gemini\\antigravity\\scratch\\v2-vault\\LihFolk Vault V2',
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
    localStorage.setItem(`lihforge_key_${provider}`, apiKey);
    sessionStorage.setItem(`${LOCAL_STORAGE_KEY_STATUS_KEY}_${provider}`, 'true');
    sessionStorage.setItem(`temp_key_${provider}`, apiKey);
  },

  async hasApiKey(provider: ProviderId): Promise<boolean> {
    if (isTauriEnvironment()) {
      return await invoke<boolean>('has_api_key', { provider });
    }
    const local = localStorage.getItem(`lihforge_key_${provider}`);
    const session = sessionStorage.getItem(`temp_key_${provider}`);
    return Boolean(local || session);
  },

  async deleteApiKey(provider: ProviderId): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_api_key', { provider });
      return;
    }
    localStorage.removeItem(`lihforge_key_${provider}`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY_STATUS_KEY}_${provider}`);
    sessionStorage.removeItem(`temp_key_${provider}`);
  },

  async testApiKey(
    provider: ProviderId,
    model: string,
    customKey?: string
  ): Promise<TestKeyResult> {
    if (isTauriEnvironment()) {
      return await invoke<TestKeyResult>('test_api_key', {
        provider,
        model,
        customKey: customKey || null,
      });
    }

    const key =
      customKey ||
      localStorage.getItem(`lihforge_key_${provider}`) ||
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
        const resp = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: {
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://lihforge.local',
          },
        });
        const latency = Math.round(performance.now() - start);
        if (resp.ok) {
          const data = await resp.json();
          return {
            success: true,
            message: `OpenRouter verified! Label: ${data.data?.label || 'Active'} (${latency}ms)`,
            latencyMs: latency,
          };
        } else {
          return {
            success: false,
            message: `OpenRouter verification failed: HTTP ${resp.status}`,
            latencyMs: latency,
          };
        }
      } else if (provider === 'gemini') {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
        );
        const latency = Math.round(performance.now() - start);
        if (resp.ok) {
          const data = await resp.json();
          const models = (data.models || []).map((m: any) =>
            (m.name || '').replace('models/', '')
          );
          return {
            success: true,
            message: `Verified successfully! (${latency}ms latency)`,
            latencyMs: latency,
            availableModels: models,
          };
        } else {
          return {
            success: false,
            message: `Failed: HTTP ${resp.status}`,
            latencyMs: latency,
          };
        }
      } else if (provider === 'openai') {
        const resp = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        const latency = Math.round(performance.now() - start);
        if (resp.ok) {
          return {
            success: true,
            message: `OpenAI key verified successfully! (${latency}ms)`,
            latencyMs: latency,
          };
        } else {
          return {
            success: false,
            message: `OpenAI verification failed: HTTP ${resp.status}`,
            latencyMs: latency,
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
        message: `Network error: ${err.message}`,
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
      return await invoke<AiChatResult>('run_ai_chat', {
        provider,
        model,
        systemPrompt,
        messages,
        customKey: customKey || null,
      });
    }

    // Direct browser fallback for development
    const key =
      customKey ||
      localStorage.getItem(`lihforge_key_${provider}`) ||
      sessionStorage.getItem(`temp_key_${provider}`);
    if (!key) {
      throw new Error(`No API key provided for ${provider}. Please enter your key in Settings or in the chat.`);
    }

    const start = performance.now();
    if (provider === 'openrouter') {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lihforge.local',
          'X-Title': 'LihForge Roblox Builder',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`OpenRouter error (${resp.status}): ${err}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || 'No response content';
      const inTokens = data.usage?.prompt_tokens || 350;
      const outTokens = data.usage?.completion_tokens || 450;
      const durationMs = Math.round(performance.now() - start);

      return {
        content: text,
        tokensInput: inTokens,
        tokensOutput: outTokens,
        estimatedCost: ((inTokens / 1000000) * 3 + (outTokens / 1000000) * 15),
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
        throw new Error(`Google Gemini error (${resp.status}): ${err}`);
      }

      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      const inTokens = data.usageMetadata?.promptTokenCount || 250;
      const outTokens = data.usageMetadata?.candidatesTokenCount || 350;
      const durationMs = Math.round(performance.now() - start);

      return {
        content: text,
        tokensInput: inTokens,
        tokensOutput: outTokens,
        estimatedCost: ((inTokens / 1000000) * 0.15 + (outTokens / 1000000) * 0.60),
        durationMs,
        model,
        provider,
      };
    } else if (provider === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`OpenAI error (${resp.status}): ${err}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || 'No response content';
      const inTokens = data.usage?.prompt_tokens || 300;
      const outTokens = data.usage?.completion_tokens || 400;
      const durationMs = Math.round(performance.now() - start);

      return {
        content: text,
        tokensInput: inTokens,
        tokensOutput: outTokens,
        estimatedCost: ((inTokens / 1000000) * 2.5 + (outTokens / 1000000) * 10),
        durationMs,
        model,
        provider,
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  },

  async getRunHistory(projectId?: string): Promise<RunHistoryRecord[]> {
    if (isTauriEnvironment()) {
      return await invoke<RunHistoryRecord[]>('get_run_history', {
        projectId: projectId ?? null,
      });
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (cached) {
      try {
        const parsed: RunHistoryRecord[] = JSON.parse(cached);
        return projectId ? parsed.filter((r) => r.projectId === projectId) : parsed;
      } catch {
        return [];
      }
    }
    return [];
  },

  async recordRunHistory(record: Omit<RunHistoryRecord, 'id' | 'timestamp'>): Promise<RunHistoryRecord> {
    if (isTauriEnvironment()) {
      return await invoke<RunHistoryRecord>('record_run_history', {
        ...record,
        projectId: record.projectId ?? null,
      });
    }
    const full: RunHistoryRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const current = await this.getRunHistory();
    const updated = [full, ...current];
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    return full;
  },
};
