import * as React from 'react';
import {
  Bot,
  User,
  Key,
  FileCode,
  Image as ImageIcon,
  FileText,
  File,
} from 'lucide-react';
import { AgentActionState, ChatMessage, Project, UserSettings } from '../../types';
import { PROVIDERS, ProviderId } from '../../../providers/types';
import { AttachmentComposerTray, AttachedFile } from '../ui/attachment-composer-tray';
import { ThinkingState, Markdown, TraceNode } from '../ui/ai-thinking-and-tool-calls';
import { runLiveAgentTurn } from '../../lib/agentEvents';

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
  hasKey,
  onSaveKey,
  onAddLog,
  onRecordSpend,
}) => {
  const [promptInput, setPromptInput] = React.useState('');
  const [inlineKeyInput, setInlineKeyInput] = React.useState('');
  const [showInlineKeyForm, setShowInlineKeyForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Chat message thread
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Welcome to **LihForge AI Builder**!

Tell me what game system, mechanics, or Luau script you want to engineer:
- *"Pet Hatching system with 3 egg rarities, luck multipliers, and opening animations"*
- *"Secure DataStore manager with session locks and BindToClose budgets"*
- *"Combat Raycast hitbox handler with hit-stop VFX and sound layers"*

I will plan the architecture, query the **LihFolk 1,300-note vault rules**, generate complete Luau scripts, and verify them against 2026 engine standards.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSubmitting(false);
    onAddLog('Agent execution cancelled by user.', 'warn', 'STOP');
  };

  const handleSendPrompt = async (textToSend: string, attachments: AttachedFile[] = []) => {
    const userPrompt = textToSend.trim();
    if ((!userPrompt && attachments.length === 0) || isSubmitting) return;

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
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userPrompt,
      attachments,
      timestamp: new Date().toISOString(),
    };

    const assistantMessageId = `msg-${Date.now()}-ai`;
    const pendingAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      traceNodes: [],
      isThinkingRunning: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);
    setPromptInput('');
    setIsSubmitting(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    onAddLog(`Starting agent run with ${settings.activeModel}...`, 'cmd', 'AI');

    await runLiveAgentTurn(
      userPrompt,
      attachments,
      activeProject,
      settings,
      {
        onNodesUpdate: (updatedNodes: TraceNode[]) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, traceNodes: updatedNodes }
                : m
            )
          );
        },
        onContentStream: () => {},
        onActionStateUpdate: (action) => {
          onAddLog(action, 'info', 'AGENT');
        },
        onComplete: (finalContent, metrics) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: finalContent,
                    isThinkingRunning: false,
                    metrics,
                  }
                : m
            )
          );
          setIsSubmitting(false);
          abortControllerRef.current = null;
          onRecordSpend(metrics.cost);
          onAddLog(
            `Agent completed turn in ${metrics.durationMs}ms ($${metrics.cost.toFixed(5)}).`,
            'success',
            'AI'
          );
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: `⚠️ **Agent Execution Error**\n\n${err.message}\n\n*Check your API key in Settings or click "Connect Key" above.*`,
                    isThinkingRunning: false,
                  }
                : m
            )
          );
          setIsSubmitting(false);
          abortControllerRef.current = null;
          onAddLog(`Agent error: ${err.message}`, 'error', 'AI');
        },
      },
      abortController.signal
    );
  };

  const selectedProviderDef = PROVIDERS[settings.activeProvider] || PROVIDERS.openrouter;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background select-none">
      {/* Context Top Header */}
      <div className="h-10 px-4 border-b border-border bg-card/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 truncate">
          <span className="font-semibold text-foreground flex items-center gap-1.5 shrink-0">
            <Bot className="h-4 w-4 text-primary" />
            <span>AI Game Builder</span>
          </span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground font-mono text-[11px] truncate">
            Target: {activeProject ? activeProject.name : 'No project loaded'}
          </span>
          {activeProject?.genre && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border shrink-0">
              {activeProject.genre}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInlineKeyForm(!showInlineKeyForm)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              hasKey
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Key className="h-3 w-3" />
            <span>{hasKey ? 'Key Connected' : 'Connect Key'}</span>
          </button>

          <span className="text-[11px] font-mono font-medium text-foreground px-2 py-0.5 rounded bg-muted border border-border">
            {settings.activeModel}
          </span>
        </div>
      </div>

      {/* Inline Quick Key Entry Drawer if opened */}
      {showInlineKeyForm && (
        <div className="p-3 bg-secondary/40 border-b border-border flex items-center gap-3 text-xs">
          <Key className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-medium text-foreground shrink-0">
            {selectedProviderDef.name} Key:
          </span>
          <input
            type="password"
            value={inlineKeyInput}
            onChange={(e) => setInlineKeyInput(e.target.value)}
            placeholder={`Paste key (${selectedProviderDef.keyPlaceholder})`}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-ring"
          />
          <button
            type="button"
            onClick={handleInlineSaveKey}
            disabled={!inlineKeyInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors disabled:opacity-40"
          >
            Save Key
          </button>
          <button
            type="button"
            onClick={() => setShowInlineKeyForm(false)}
            className="text-muted-foreground hover:text-foreground text-xs px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Chat Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-secondary border-border text-foreground'
                    : 'bg-card border-border text-primary'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Message Content Container */}
              <div
                className={`max-w-3xl space-y-2 ${
                  isUser ? 'items-end' : 'items-start flex-1'
                }`}
              >
                {/* User Bubble */}
                {isUser ? (
                  <div className="rounded-2xl rounded-tr-sm bg-muted/80 border border-border px-4 py-2.5 text-xs text-foreground leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Attached files chips inside user bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                        {msg.attachments.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/60 text-muted-foreground text-[10px] font-mono border border-border/40"
                          >
                            {att.type === 'image' && <ImageIcon className="h-2.5 w-2.5 text-blue-400" />}
                            {att.type === 'luau' && <FileCode className="h-2.5 w-2.5 text-emerald-400" />}
                            {att.type === 'markdown' && <FileText className="h-2.5 w-2.5 text-amber-400" />}
                            {att.type === 'other' && <File className="h-2.5 w-2.5 text-muted-foreground" />}
                            <span>{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Assistant Turn */
                  <div className="w-full space-y-2">
                    {/* Live Thinking State & Tool Calls Accordion */}
                    {msg.traceNodes && msg.traceNodes.length > 0 && (
                      <ThinkingState
                        nodes={msg.traceNodes}
                        isLive={true}
                        status={
                          msg.isThinkingRunning
                            ? 'running'
                            : msg.traceNodes.some((n) => n.status === 'failed')
                            ? 'failed'
                            : 'completed'
                        }
                      />
                    )}

                    {/* Final Markdown Answer */}
                    {msg.content && (
                      <div className="rounded-2xl rounded-tl-sm bg-card/60 border border-border p-4 text-xs text-foreground leading-relaxed">
                        <Markdown content={msg.content} />

                        {/* Turn Metrics Footer */}
                        {msg.metrics && (
                          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                            <span>
                              Model: {msg.metrics.model} ({msg.metrics.durationMs}ms)
                            </span>
                            <span className="text-foreground font-semibold">
                              {msg.metrics.tokensInput + msg.metrics.tokensOutput} tokens (${msg.metrics.cost.toFixed(5)})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Pinned Bottom Composer with Removable Attachment Tray */}
      <div className="p-3 border-t border-border bg-card/40">
        <AttachmentComposerTray
          value={promptInput}
          onChange={setPromptInput}
          onSubmit={(text, attachments) => handleSendPrompt(text, attachments)}
          onStop={handleStop}
          isLoading={isSubmitting}
          disabled={!hasKey && !inlineKeyInput.trim()}
          placeholder={
            hasKey
              ? 'Describe what Roblox system, mechanics, or Luau script to engineer... (Enter to send)'
              : 'Connect your API key above to start building...'
          }
          quickPrompts={[
            'Pet Hatching System with 3 egg rarities & luck multipliers',
            'Leaderboard DataStore service with anti-spam remotes',
            'Combat Raycast hitbox with hit-stop & VFX',
            'Simulator Shop UI with Robux dev products',
          ]}
        />
      </div>
    </div>
  );
};
