import React, { useState, useEffect } from 'react';
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
  Zap,
} from 'lucide-react';
import { PROVIDERS, ProviderId } from '../../../providers/types';
import { UserSettings } from '../../types';
import { api, TestKeyResult } from '../../lib/api';
import { localAuth } from '../../auth';

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
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<TestKeyResult | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const selectedProviderDef = PROVIDERS[settings.activeProvider] || PROVIDERS.openrouter;

  // Check if keychain has key for the currently selected provider
  useEffect(() => {
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
        `API Key for ${selectedProviderDef.name} securely saved in OS Keychain (Windows Credential Manager).`,
        'success'
      );
    } catch (err: any) {
      onAddLog(`Failed to save key in keychain: ${err.message}`, 'error');
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
      onAddLog(`API key for ${selectedProviderDef.name} removed from OS Keychain.`, 'info');
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
        onAddLog(`[OK] Key test passed: ${result.message}`, 'success');
      } else {
        onAddLog(`[TEST FAILED] ${result.message}`, 'warn');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.toString(),
      });
      onAddLog(`[ERROR] Test error: ${err.message}`, 'error');
    } finally {
      setTestingKey(false);
    }
  };

  const authSession = localAuth.getSession();

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 select-none">
      {/* Top Banner: BYOK Security Guarantee */}
      <div className="p-4 rounded-xl glass-panel border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/40 flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Bring Your Own Key (BYOK) & OS Keychain Storage</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ZERO TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            Your API keys are stored exclusively in your local OS Keychain (Windows Credential Manager)
            using hardware-backed security. They are never saved to plain text files, never stored in localStorage,
            and never routed through any third-party server of ours. You only pay the AI provider directly for the tokens you use.
          </p>
        </div>
      </div>

      {/* Provider & Model Selection */}
      <div className="p-5 rounded-xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              AI Provider & Model Engine
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            DYNAMIC MODEL INTERFACE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pick Provider */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Select AI Provider
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
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center space-y-0.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{prov.name}</span>
                    {isSelected && (
                      <span className="text-[9px] font-mono text-indigo-300">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pick Model (Dynamic Dropdown) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Active Model ({selectedProviderDef.name})
            </label>
            <select
              value={settings.activeModel}
              onChange={(e) => onUpdateSettings({ activeModel: e.target.value })}
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-400 transition-colors"
            >
              {selectedProviderDef.models.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#121420] text-zinc-100">
                  {m.name} {m.recommended ? '(Recommended)' : ''} — ${m.costPerMillionInputTokens}/M in
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              {selectedProviderDef.models.find((m) => m.id === settings.activeModel)?.description ||
                'Selected engine for planning, Luau writing, and validation.'}
            </p>
          </div>
        </div>

        {/* API Key Management */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedProviderDef.name} API Key</span>
            </label>
            <a
              href={selectedProviderDef.keyHelpUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Get API key from {selectedProviderDef.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  hasStoredKey
                    ? '•••••••••••••••••••••••• (Key stored securely in OS Keychain)'
                    : `Paste your ${selectedProviderDef.name} key (${selectedProviderDef.keyPlaceholder})`
                }
                className="w-full bg-black/60 border border-white/15 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKeyInput.trim() || savingKey}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                !apiKeyInput.trim()
                  ? 'bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 active:scale-95'
              }`}
            >
              {savingKey ? 'Saving...' : 'Save to Keychain'}
            </button>

            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingKey || (!hasStoredKey && !apiKeyInput.trim())}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                testingKey || (!hasStoredKey && !apiKeyInput.trim())
                  ? 'bg-white/5 border-white/10 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10 active:scale-95'
              }`}
            >
              {testingKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Key</span>
                </>
              )}
            </button>
          </div>

          {/* Stored Key Status pill & Delete button */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasStoredKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
                }`}
              />
              <span className="text-zinc-400 font-mono text-[11px]">
                {hasStoredKey
                  ? 'Key is active in Windows Credential Manager'
                  : 'No key currently saved in OS keychain for this provider'}
              </span>
              {saveSuccessNotice && (
                <span className="text-emerald-400 text-xs font-medium animate-pulse ml-2">
                  ✓ Successfully saved!
                </span>
              )}
            </div>

            {hasStoredKey && (
              <button
                type="button"
                onClick={handleDeleteKey}
                className="text-rose-400 hover:text-rose-300 text-[11px] underline underline-offset-2"
              >
                Delete from Keychain
              </button>
            )}
          </div>

          {/* Test Key Results Box */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-1.5 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.availableModels && testResult.availableModels.length > 0 && (
                <div className="text-[10px] text-zinc-400 pt-1">
                  Discovered {testResult.availableModels.length} compatible models on your key.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Budget & Hard Safety Stop */}
      <div className="p-5 rounded-xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Budget Limits & Hard Stop
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            AUTO-KILL SWITCH
          </span>
        </div>

        <p className="text-xs text-zinc-300">
          The app calculates input/output token usage per request and tracks estimated spend.
          If the limit is reached, the agent is halted immediately so you are never surprised by your API bill.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Monthly Budget Limit ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={settings.monthlyBudgetLimit}
                onChange={(e) =>
                  onUpdateSettings({ monthlyBudgetLimit: parseFloat(e.target.value) || 5.0 })
                }
                className="w-full bg-black/60 border border-white/15 rounded-md pl-7 pr-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-400"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Default: $10.00 / month. Agent stops once monthly estimate hits this limit.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Single-Session Budget Limit ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={settings.sessionBudgetLimit}
                onChange={(e) =>
                  onUpdateSettings({ sessionBudgetLimit: parseFloat(e.target.value) || 2.0 })
                }
                className="w-full bg-black/60 border border-white/15 rounded-md pl-7 pr-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-400"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Default: $2.00 / session. Prevents accidental infinite execution loops.
            </span>
          </div>
        </div>
      </div>

      {/* Knowledge Vault Path Configuration */}
      <div className="p-5 rounded-xl glass-panel space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Folder className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Roblox Knowledge Vault Folder
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            PHASE 3 READY
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          LihForge consults 1,300+ curated Roblox notes and symptom checklists before generating code.
          You can use the default built-in vault or specify a custom folder.
        </p>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Vault Root Directory
          </label>
          <input
            type="text"
            value={settings.vaultPath}
            onChange={(e) => onUpdateSettings({ vaultPath: e.target.value })}
            className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Local Auth Stub Info */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-zinc-300">
            SC
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              {authSession.user.username}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Mode: Local BYOK | Tier: {authSession.user.tier.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 italic">
          Auth Stub: Accounts/Licenses can be attached in future releases.
        </div>
      </div>
    </div>
  );
};
