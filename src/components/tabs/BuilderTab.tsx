import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  StopCircle,
  Lightbulb,
  Copy,
  Check,
  Key,
  FileCode2,
  RefreshCw,
} from 'lucide-react';
import { AgentActionState, ChatMessage, Project, UserSettings } from '../../types';
import { api } from '../../lib/api';
import { PROVIDERS, ProviderId } from '../../../providers/types';

interface BuilderTabProps {
  activeProject: Project | null;
  settings: UserSettings;
  actionState: AgentActionState;
  onRunPrompt: (prompt: string) => void;
  onStopPrompt: () => void;
  hasKey: boolean;
  onSaveKey: (provider: ProviderId, key: string) => Promise<void>;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'error' | 'success' | 'cmd', badge?: string) => void;
  onRecordSpend: (cost: number) => void;
}

export const BuilderTab: React.FC<BuilderTabProps> = ({
  activeProject,
  settings,
  actionState,
  onStopPrompt,
  hasKey,
  onSaveKey,
  onAddLog,
  onRecordSpend,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [showInlineKeyForm, setShowInlineKeyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Chat message thread
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `👋 **Welcome to LihForge!**

I am your AI Roblox Game Engineering Partner. Tell me what game system, mechanics, or feature you want to create:
- *“Create a Pet Hatching system with 3 egg rarities, luck multipliers, and opening animations.”*
- *“Build a secure DataStore manager for player stats with retry budgets and BindToClose.”*
- *“Generate an Obby checkpoint runner with kill-bricks, moving obstacles, and sound FX.”*

I will design the architecture, generate complete Luau scripts, verify against the **LihFolk 1,300-note vault rules**, and prepare it for Roblox Studio.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const handleInlineSaveKey = async () => {
    if (!inlineKeyInput.trim()) return;
    try {
      await onSaveKey(settings.activeProvider, inlineKeyInput.trim());
      setInlineKeyInput('');
      setShowInlineKeyForm(false);
      onAddLog(
        `API Key for ${PROVIDERS[settings.activeProvider].name} saved to OS Keychain.`,
        'success',
        'KEYCHAIN'
      );
    } catch (err: any) {
      onAddLog(`Failed to save key: ${err.message}`, 'error');
    }
  };

  const handleSendPrompt = async (textToSend: string) => {
    const userPrompt = textToSend.trim();
    if (!userPrompt || isSubmitting) return;

    // Check budget limit
    if (actionState.spentBudget >= settings.monthlyBudgetLimit) {
      onAddLog(
        `[BUDGET STOP] Monthly limit ($${settings.monthlyBudgetLimit.toFixed(2)}) reached.`,
        'error',
        'BUDGET'
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptInput('');
    setIsSubmitting(true);

    onAddLog(`Executing prompt with ${settings.activeModel}...`, 'cmd', 'AI');

    // System instruction enforcing strict Roblox 2026 standards and LihFolk vault principles
    const systemPrompt = `You are LihForge, a senior Roblox full-stack game architect and Luau engineer.
Active Project: "${activeProject?.name || 'Default Roblox Experience'}" (Genre: ${activeProject?.genre || 'Simulator'}).
Gameplay brief: "${activeProject?.notes || 'Standard Roblox experience'}".

When the user asks you to build or code a game system, feature, or script:
1. Give a crisp 3-4 sentence architecture explanation of how the system works.
2. Outline the 4-step pipeline: (1) Architecture Plan, (2) Luau Implementation, (3) Anti-Exploit & Error Audit, (4) Studio Placement.
3. Provide PRODUCTION-READY, FULLY FUNCTIONAL Luau code.
   - Use strict typing (--!strict).
   - Never use deprecated wait() (always task.wait()).
   - RemoteEvents must be strictly validated on the server with type and range checks.
   - For player data, follow session-locking and BindToClose patterns.
   - Format Luau code in standard \`\`\`luau code blocks and specify the exact Studio location (e.g. -- Path: ServerScriptService/PetService.luau).
4. Be proactive: recommend the next logical feature or sound/VFX polish.`;

    try {
      // Build conversation context for API
      const conversationContext = messages
        .filter((m) => m.id !== 'msg-welcome')
        .concat(userMessage)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await api.runAiChat(
        settings.activeProvider,
        settings.activeModel,
        systemPrompt,
        conversationContext,
        inlineKeyInput.trim() ? inlineKeyInput.trim() : undefined
      );

      // Parse code block if present
      const codeMatch = response.content.match(/```(?:luau|lua)?\n([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[1].trim() : undefined;

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        codeSnippet: code
          ? {
              filename: 'Script.luau',
              targetLocation: 'ServerScriptService',
              code,
            }
          : undefined,
        metrics: {
          tokensInput: response.tokensInput,
          tokensOutput: response.tokensOutput,
          cost: response.estimatedCost,
          durationMs: response.durationMs,
          model: response.model,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onRecordSpend(response.estimatedCost);

      onAddLog(
        `AI generated response in ${response.durationMs}ms (${response.tokensInput + response.tokensOutput} tokens, $${response.estimatedCost.toFixed(5)}).`,
        'success',
        'AI'
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `⚠️ **AI Execution Error:**\n\n${err.message}\n\n*Tip: Check that your API key is valid and has quota, or enter your key in the bar above.*`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      onAddLog(`AI Error: ${err.message}`, 'error', 'AI');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCodeToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const selectedProviderDef = PROVIDERS[settings.activeProvider] || PROVIDERS.openrouter;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#090a10]">
      {/* Context Bar */}
      <div className="h-10 px-4 border-b border-white/10 bg-black/40 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 truncate">
          <span className="font-semibold text-zinc-300 flex items-center space-x-1.5 flex-shrink-0">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>AI Game Builder</span>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 font-mono text-[11px] truncate">
            Target: {activeProject ? activeProject.name : 'No project loaded'}
          </span>
          {activeProject?.genre && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex-shrink-0">
              {activeProject.genre}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setShowInlineKeyForm(!showInlineKeyForm)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
              hasKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 animate-pulse'
            }`}
          >
            <Key className="w-3 h-3" />
            <span>{hasKey ? 'Key Connected' : 'Paste API Key'}</span>
          </button>

          <span className="text-[11px] font-mono font-medium text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30">
            {settings.activeModel}
          </span>
        </div>
      </div>

      {/* Inline Quick Key Entry Drawer if opened */}
      {showInlineKeyForm && (
        <div className="p-3 bg-[#111320] border-b border-indigo-500/30 flex items-center space-x-3 text-xs">
          <Key className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-zinc-200 flex-shrink-0">
            {selectedProviderDef.name} Key:
          </span>
          <input
            type="password"
            value={inlineKeyInput}
            onChange={(e) => setInlineKeyInput(e.target.value)}
            placeholder={`Paste your ${selectedProviderDef.name} key (${selectedProviderDef.keyPlaceholder})`}
            className="flex-1 bg-black/60 border border-white/20 rounded-md px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleInlineSaveKey}
            disabled={!inlineKeyInput.trim()}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
          >
            Save to Keychain
          </button>
          <button
            onClick={() => setShowInlineKeyForm(false)}
            className="text-zinc-400 hover:text-white text-xs px-2"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Chat Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  isUser
                    ? 'bg-indigo-600/30 border-indigo-400/40 text-indigo-300'
                    : 'bg-zinc-800/80 border-white/10 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-zinc-100 shadow-sm'
                    : 'glass-panel border-white/10 text-zinc-200'
                }`}
              >
                <div className="prose prose-invert max-w-none text-xs space-y-2 whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Code Snippet Box if present */}
                {msg.codeSnippet && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/15 bg-black/70">
                    <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center space-x-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{msg.codeSnippet.targetLocation} / {msg.codeSnippet.filename}</span>
                      </span>
                      <button
                        onClick={() => copyCodeToClipboard(msg.codeSnippet!.code, msg.id)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                      >
                        {copiedCodeId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy Luau Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto max-h-72 select-text">
                      <code>{msg.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* Metrics Footer */}
                {msg.metrics && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>
                      Model: {msg.metrics.model} ({msg.metrics.durationMs}ms)
                    </span>
                    <span className="text-indigo-400 font-semibold">
                      {msg.metrics.tokensInput + msg.metrics.tokensOutput} tokens (${msg.metrics.cost.toFixed(5)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isSubmitting && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-white/10 text-emerald-400 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 rounded-xl glass-panel border-white/10 text-xs text-zinc-300 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span className="font-mono">Planning architecture & generating Luau script...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-1.5 bg-[#08090e] border-t border-white/5 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1 flex-shrink-0">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Quick:</span>
        </span>
        {[
          'Pet Hatching System with 3 egg rarities & luck multipliers',
          'Leaderboard DataStore service with anti-spam remotes',
          'Simulator Shop UI with Robux purchase hooks',
          'Combat Hitbox raycaster with hit-stop & VFX',
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendPrompt(prompt)}
            className="text-[11px] px-2.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-colors flex-shrink-0 truncate max-w-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Bottom Chat Prompt Input */}
      <div className="p-3 border-t border-white/10 bg-[#0c0d14]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(promptInput);
          }}
          className="relative"
        >
          <textarea
            rows={2}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(promptInput);
              }
            }}
            placeholder={
              hasKey
                ? "Describe what Roblox game, feature, mechanics or Luau script you want to build... (Enter to send)"
                : "Enter your request here (paste your OpenRouter or Gemini API key above to start)..."
            }
            className="w-full bg-black/60 border border-white/15 rounded-xl pl-3 pr-24 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
          />

          <div className="absolute right-2.5 bottom-3.5 flex items-center space-x-1.5">
            {isSubmitting ? (
              <button
                type="button"
                onClick={onStopPrompt}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md active:scale-95"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Build</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
