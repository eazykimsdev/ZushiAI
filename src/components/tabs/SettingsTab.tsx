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
} from 'lucide-react';
import { PROVIDERS, ProviderId } from '../../../providers/types';
import { UserSettings } from '../../types';
import { api, TestKeyResult } from '../../lib/api';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onKeyStatusChange: () => void;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;
}

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
  const [savingKey, setSavingKey] = React.useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState(false);

  const selectedProviderDef = PROVIDERS[settings.activeProvider] || PROVIDERS.openrouter;

  React.useEffect(() => {
    let isMounted = true;
    api.hasApiKey(settings.activeProvider).then((has) => {
      if (isMounted) setHasStoredKey(has);
    });
    return () => {
      isMounted = false;
    };
  }, [settings.activeProvider]);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      await api.saveApiKey(settings.activeProvider, apiKeyInput.trim());
      setHasStoredKey(true);
      setApiKeyInput('');
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
      onKeyStatusChange();
      onAddLog(
        `API Key for ${selectedProviderDef.name} saved to OS Keychain.`,
        'success'
      );
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
      onKeyStatusChange();
      onAddLog(`API key for ${selectedProviderDef.name} removed.`, 'info');
    } catch (err: any) {
      onAddLog(`Failed to delete key: ${err.message}`, 'error');
    }
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const result = await api.testApiKey(
        settings.activeProvider,
        settings.activeModel,
        apiKeyInput.trim() ? apiKeyInput.trim() : undefined
      );
      setTestResult(result);
      if (result.success) {
        onAddLog(`Key verified: ${result.message}`, 'success');
      } else {
        onAddLog(`Key test failed: ${result.message}`, 'warn');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.toString(),
      });
      onAddLog(`Test error: ${err.message}`, 'error');
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* Top Banner: Security Guarantee */}
      <div className="surface-card p-4 flex items-start gap-3.5">
        <div className="p-2 rounded-md bg-secondary text-primary border border-border">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-foreground">
              Bring Your Own Key (BYOK)
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              Zero Telemetry
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Your API keys are stored in your local OS Keychain (Windows Credential Manager) and never sent to our servers.
            You only pay the AI provider directly for the tokens you generate.
          </p>
        </div>
      </div>

      {/* Provider & Model Selection */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              AI Provider & Model Engine
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pick Provider */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDERS) as ProviderId[]).map((pid) => {
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

          {/* Pick Model */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Active Model ({selectedProviderDef.name})
            </label>
            <select
              value={settings.activeModel}
              onChange={(e) => onUpdateSettings({ activeModel: e.target.value })}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring transition-colors"
            >
              {selectedProviderDef.models.map((m) => (
                <option key={m.id} value={m.id} className="bg-card text-foreground">
                  {m.name} {m.recommended ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground leading-normal mt-1">
              {selectedProviderDef.models.find((m) => m.id === settings.activeModel)?.description ||
                'Active engine for architecture and Luau writing.'}
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
              <span>Test</span>
            </button>
          </div>

          {saveSuccessNotice && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Key saved securely.</span>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-[10px] border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">{testResult.message}</div>
                {testResult.availableModels && testResult.availableModels.length > 0 && (
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    Available: {testResult.availableModels.slice(0, 5).join(', ')}...
                  </div>
                )}
              </div>
            </div>
          )}

          {hasStoredKey && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">
                Key status: Connected in Keychain
              </span>
              <button
                type="button"
                onClick={handleDeleteKey}
                className="text-destructive hover:underline text-xs"
              >
                Delete stored key
              </button>
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
