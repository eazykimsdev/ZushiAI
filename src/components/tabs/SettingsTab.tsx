import * as React from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Cpu,
  Folder,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { PROVIDERS, ProviderId, LiveModelInfo } from '../../../providers/types';
import { UserSettings } from '../../types';
import { api, TestKeyResult } from '../../lib/api';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onKeyStatusChange: () => void;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;
}

export type KeyConnectionState = 'not_set' | 'checking' | 'connected' | 'failed';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onKeyStatusChange,
  onAddLog,
}) => {
  const [apiKeyInput, setApiKeyInput] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);
  const [hasStoredKey, setHasStoredKey] = React.useState(false);
  const [testingKey, setTestingKey] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestKeyResult | null>(null);
  const [keyState, setKeyState] = React.useState<KeyConnectionState>('not_set');
  const [savingKey, setSavingKey] = React.useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState(false);

  // Dynamic Live Models State
  const [models, setModels] = React.useState<LiveModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [modelSearch, setModelSearch] = React.useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedProviderDef = PROVIDERS[settings.activeProvider] || PROVIDERS.openrouter;

  // Check stored key on load or provider switch
  React.useEffect(() => {
    let isMounted = true;
    api.hasApiKey(settings.activeProvider).then((has) => {
      if (isMounted) {
        setHasStoredKey(has);
        if (!has) {
          setKeyState('not_set');
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [settings.activeProvider]);

  // Load models on provider switch or key change
  const loadModels = React.useCallback(
    async (customKey?: string) => {
      setLoadingModels(true);
      try {
        const fetched = await api.fetchLiveModels(settings.activeProvider, customKey);
        if (fetched && fetched.length > 0) {
          setModels(fetched);
          // If active model is not in fetched list and we have a last working model, use it
          const lastWorking = api.getLastWorkingModel(settings.activeProvider);
          if (lastWorking && fetched.some((m) => m.id === lastWorking)) {
            if (settings.activeModel !== lastWorking) {
              onUpdateSettings({ activeModel: lastWorking });
            }
          } else if (!fetched.some((m) => m.id === settings.activeModel)) {
            // Default to first or recommended model
            const best = fetched.find((m) => m.recommended) || fetched[0];
            if (best) onUpdateSettings({ activeModel: best.id });
          }
        } else {
          setModels(selectedProviderDef.fallbackModels);
        }
      } catch {
        setModels(selectedProviderDef.fallbackModels);
      } finally {
        setLoadingModels(false);
      }
    },
    [settings.activeProvider, settings.activeModel, selectedProviderDef, onUpdateSettings]
  );

  React.useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      await api.saveApiKey(settings.activeProvider, apiKeyInput.trim());
      setHasStoredKey(true);
      const keyVal = apiKeyInput.trim();
      setApiKeyInput('');
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
      onKeyStatusChange();
      onAddLog(`API Key for ${selectedProviderDef.name} saved securely.`, 'success');
      // Re-load models with new key and test
      await loadModels(keyVal);
    } catch (err: any) {
      onAddLog(`Failed to save key: ${err.message}`, 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    try {
      await api.deleteApiKey(settings.activeProvider);
      setHasStoredKey(false);
      setTestResult(null);
      setKeyState('not_set');
      onKeyStatusChange();
      onAddLog(`API key for ${selectedProviderDef.name} removed.`, 'info');
      loadModels();
    } catch (err: any) {
      onAddLog(`Failed to delete key: ${err.message}`, 'error');
    }
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setKeyState('checking');
    setTestResult(null);
    try {
      const result = await api.testApiKey(
        settings.activeProvider,
        settings.activeModel,
        apiKeyInput.trim() ? apiKeyInput.trim() : undefined
      );
      setTestResult(result);
      if (result.success) {
        setKeyState('connected');
        if (result.availableModels && result.availableModels.length > 0) {
          setModels(result.availableModels);
        }
        onKeyStatusChange();
        onAddLog(`Key verified: ${result.message}`, 'success');
      } else {
        setKeyState('failed');
        onAddLog(`Key verification failed: ${result.message}`, 'warn');
      }
    } catch (err: any) {
      setKeyState('failed');
      setTestResult({
        success: false,
        message: err.humanMessage || err.message || err.toString(),
        rawError: err.rawError || String(err),
      });
      onAddLog(`Test error: ${err.message}`, 'error');
    } finally {
      setTestingKey(false);
    }
  };

  // Filter models for searchable dropdown
  const filteredModels = React.useMemo(() => {
    if (!modelSearch.trim()) return models;
    const query = modelSearch.toLowerCase();
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query))
    );
  }, [models, modelSearch]);

  const activeModelObj = models.find((m) => m.id === settings.activeModel);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* Top Banner: Security Guarantee */}
      <div className="surface-card p-4 flex items-start gap-3.5">
        <div className="p-2 rounded-[10px] bg-secondary text-primary border border-border">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-foreground">
              Bring Your Own Key (BYOK)
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              Local Keychain Only · Zero Telemetry
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Keys are stored in your OS Keychain (Windows Credential Manager) and never logged or sent to any central server.
            You pay only your model provider directly.
          </p>
        </div>
      </div>

      {/* Provider & Model Selection */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              Provider & Live Models
            </h3>
          </div>
          <button
            type="button"
            onClick={() => loadModels()}
            disabled={loadingModels}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loadingModels ? 'animate-spin' : ''}`} />
            <span>Refresh models</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pick Provider */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['openrouter', 'gemini'] as ProviderId[]).map((pid) => {
                const prov = PROVIDERS[pid];
                const isSelected = settings.activeProvider === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        activeProvider: pid,
                        activeModel: prov.defaultModel,
                      });
                      setTestResult(null);
                      setKeyState('not_set');
                    }}
                    className={`py-2 px-3 rounded-[10px] text-xs font-medium border text-center transition-colors duration-140 ${
                      isSelected
                        ? 'bg-secondary border-primary text-foreground'
                        : 'bg-background hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{prov.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable Live Model Dropdown */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-foreground">
              Active Model ({selectedProviderDef.name})
            </label>

            {/* Custom Dropdown Trigger */}
            <div
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="truncate mr-2">
                <span className="font-medium">{activeModelObj?.name || settings.activeModel}</span>
                <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">
                  ({settings.activeModel})
                </span>
              </div>
              {isModelDropdownOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>

            {/* Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 surface-card border border-border rounded-[10px] shadow-xl max-h-72 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="p-2 border-b border-border bg-surface-1 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search live models..."
                    autoFocus
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {loadingModels && <RefreshCw className="h-3 w-3 animate-spin text-primary" />}
                </div>

                {/* Model List */}
                <div className="overflow-y-auto flex-1 p-1 divide-y divide-border/30">
                  {filteredModels.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      No models matching "{modelSearch}"
                    </div>
                  ) : (
                    filteredModels.map((m) => {
                      const isSelected = settings.activeModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            onUpdateSettings({ activeModel: m.id });
                            setIsModelDropdownOpen(false);
                            setTestResult(null);
                          }}
                          className={`p-2.5 rounded-[8px] cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{m.name}</span>
                            {m.recommended && (
                              <span className="text-[10px] bg-primary/20 text-accent-text px-1.5 py-0.5 rounded-full font-sans flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5" /> Best
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5 font-mono">
                            <span className="truncate">{m.id}</span>
                            {m.contextLength && (
                              <span>{Math.round(m.contextLength / 1000)}k ctx</span>
                            )}
                          </div>
                          {m.description && (
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5 font-sans">
                              {m.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-normal mt-1">
              {activeModelObj?.description || 'Active engine for architecture and Luau writing.'}
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>{selectedProviderDef.name} Key</span>
            </label>
            <a
              href={selectedProviderDef.keyHelpUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <span>Get API key</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  hasStoredKey
                    ? '•••••••••••••••••••••••• (Stored in OS Keychain)'
                    : `Paste your key (${selectedProviderDef.keyPlaceholder})`
                }
                className="w-full bg-background border border-border rounded-[10px] pl-3 pr-10 py-2 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKeyInput.trim() || savingKey}
              className="px-4 py-2 rounded-[10px] text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-140 disabled:opacity-40"
            >
              {savingKey ? 'Saving...' : 'Save Key'}
            </button>

            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingKey || (!apiKeyInput.trim() && !hasStoredKey)}
              className="px-3.5 py-2 rounded-[10px] text-xs font-medium bg-secondary hover:bg-muted border border-border text-foreground transition-colors duration-140 disabled:opacity-40 flex items-center gap-1.5"
            >
              {testingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>Test Key</span>
            </button>
          </div>

          {/* Key State Badge */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  keyState === 'connected'
                    ? 'bg-emerald-400'
                    : keyState === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : keyState === 'failed'
                    ? 'bg-rose-400'
                    : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-muted-foreground font-medium">
                {keyState === 'connected'
                  ? 'Key connected'
                  : keyState === 'checking'
                  ? 'Checking 1-token response...'
                  : keyState === 'failed'
                  ? 'Verification failed'
                  : hasStoredKey
                  ? 'Key saved (untested)'
                  : 'Not set'}
              </span>
            </div>

            {hasStoredKey && (
              <button
                type="button"
                onClick={handleDeleteKey}
                className="text-rose-400 hover:underline text-[11px] ml-auto"
              >
                Delete stored key
              </button>
            )}
          </div>

          {saveSuccessNotice && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Key saved securely to OS Keychain.</span>
            </div>
          )}

          {/* Test Key Result Display */}
          {testResult && (
            <div
              className={`p-3 rounded-[10px] border text-xs space-y-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{testResult.message}</div>
                  {testResult.latencyMs && (
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Roundtrip latency: {testResult.latencyMs}ms
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestion if 404 Model */}
              {testResult.suggestedModel && (
                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[11px]">
                    Suggested replacement: <strong className="font-mono">{testResult.suggestedModel}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (testResult.suggestedModel) {
                        onUpdateSettings({ activeModel: testResult.suggestedModel });
                        setTestResult(null);
                        handleTestKey();
                      }
                    }}
                    className="px-2.5 py-1 rounded-[6px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-medium transition-colors"
                  >
                    Switch & Re-test
                  </button>
                </div>
              )}

              {/* Expandable Raw Error Details */}
              {testResult.rawError && (
                <details className="pt-1 text-[11px]">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-mono">
                    Expand Details
                  </summary>
                  <pre className="mt-1.5 p-2 rounded bg-black/40 text-[11px] font-mono whitespace-pre-wrap break-all text-muted-foreground border border-border/50">
                    {testResult.rawError}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Budget & Safety Controls */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              Budget & Safety Limits
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Spend Guard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Monthly Hard Limit ($ USD)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="500"
              value={settings.monthlyBudgetLimit}
              onChange={(e) =>
                onUpdateSettings({ monthlyBudgetLimit: parseFloat(e.target.value) || 10 })
              }
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-ring"
            />
            <p className="text-[11px] text-muted-foreground">
              Stops all automated prompts when reached.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Session Soft Limit ($ USD)
            </label>
            <input
              type="number"
              step="0.25"
              min="0.5"
              max="50"
              value={settings.sessionBudgetLimit}
              onChange={(e) =>
                onUpdateSettings({ sessionBudgetLimit: parseFloat(e.target.value) || 2 })
              }
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-ring"
            />
            <p className="text-[11px] text-muted-foreground">
              Visual warning threshold during builder sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Knowledge Vault Path */}
      <div className="surface-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              LihFolk Engineering Vault
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            1,300+ Notes
          </span>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Vault Path (Obsidian / Markdown Directory)
          </label>
          <input
            type="text"
            value={settings.vaultPath}
            onChange={(e) => onUpdateSettings({ vaultPath: e.target.value })}
            className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-ring"
          />
          <p className="text-[11px] text-muted-foreground">
            Source path for anti-exploit rules, data safety patterns, and Studio building rubrics.
          </p>
        </div>
      </div>
    </div>
  );
};
