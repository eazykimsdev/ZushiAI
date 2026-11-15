import * as React from 'react';
import {
  CheckCircle2,
  Circle,
  Radio,
  FileCode,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
} from 'lucide-react';
import { AgentActionState, ChatMessage, StatusLights, Scoreboard, RunHistoryRecord } from '../../types';

interface RightPanelProps {
  actionState: AgentActionState;
  statusLights: StatusLights;
  scoreboard?: Scoreboard;
  runHistory?: RunHistoryRecord[];
  activeMessage?: ChatMessage | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  monthlyLimit: number;
  onPairStudio?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  actionState,
  statusLights,
  activeMessage,
  collapsed = false,
  onToggleCollapse,
  monthlyLimit,
  onPairStudio,
}) => {
  const [selectedFileCode, setSelectedFileCode] = React.useState<{ name: string; code: string } | null>(null);

  if (collapsed) {
    return (
      <div className="w-12 border-l border-border bg-surface-1 flex flex-col items-center py-4 select-none shrink-0 transition-all duration-200">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[8px] hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Expand Build panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-mono [writing-mode:vertical-lr] text-muted-foreground uppercase tracking-widest">
            Build Info
          </span>
        </div>
      </div>
    );
  }

  // Fallback default plan steps if not yet generated
  const defaultPlan = [
    { id: 'step-1', title: 'Infer mechanics & architecture', status: 'done', detail: 'Analysis complete' },
    { id: 'step-2', title: 'Query LihFolk Vault standards', status: 'done', detail: 'Remote safety & type rules' },
    { id: 'step-3', title: 'Draft Luau scripts & RemoteEvents', status: actionState.taskCurrent >= 3 ? 'done' : 'active', detail: 'ServerScriptService' },
    { id: 'step-4', title: 'Run Luau static checker', status: actionState.taskCurrent >= 4 ? 'done' : 'pending', detail: 'Type-safety verification' },
    { id: 'step-5', title: 'Score against LihFolk rubrics', status: actionState.taskCurrent >= 5 ? 'done' : 'pending', detail: 'Threshold: 8.5/10' },
  ];

  const planSteps = activeMessage?.planSteps && activeMessage.planSteps.length > 0
    ? activeMessage.planSteps
    : defaultPlan;

  // Extract changed files from snippet or trace
  const filesChanged = React.useMemo(() => {
    const list: { name: string; location: string; code?: string }[] = [];
    if (activeMessage?.codeSnippet) {
      list.push({
        name: activeMessage.codeSnippet.filename,
        location: activeMessage.codeSnippet.targetLocation,
        code: activeMessage.codeSnippet.code,
      });
    }
    // Also parse traceNodes for edited files
    if (activeMessage?.traceNodes) {
      for (const node of activeMessage.traceNodes) {
        if (node.toolName === 'edit_file' && node.title) {
          if (!list.some((f) => f.name === node.title)) {
            list.push({
              name: node.title.split('/').pop() || node.title,
              location: node.title,
              code: node.code,
            });
          }
        }
      }
    }
    if (list.length === 0) {
      list.push({
        name: 'MainModule.luau',
        location: 'ServerScriptService.MainModule',
        code: '--!strict\n-- Luau implementation scaffold\n',
      });
    }
    return list;
  }, [activeMessage]);

  const isExecuting = actionState.status === 'executing' || actionState.status === 'planning' || actionState.status === 'fixing';

  return (
    <aside className="w-[320px] border-l border-border bg-surface-1 flex flex-col select-none h-full overflow-hidden shrink-0 transition-all duration-200">
      {/* Panel Header */}
      <div className="h-13 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Build Plan & Status
          </span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-[6px] hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Collapse panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Live Step Status */}
        <div className="surface-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Live Step</span>
            </span>
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                isExecuting ? 'text-accent-text' : 'text-muted-foreground'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isExecuting ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'
                }`}
              />
              <span>{isExecuting ? 'Working' : 'Ready'}</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {actionState.currentAction || 'Ready for user instructions.'}
          </div>
        </div>

        {/* 5-8 Step Plan Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Plan Checklist</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {planSteps.filter((s) => s.status === 'done').length}/{planSteps.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {planSteps.map((step) => {
              const isDone = step.status === 'done';
              const isActive = step.status === 'active';
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-[8px] text-xs border flex items-start gap-2.5 transition-colors ${
                    isDone
                      ? 'bg-surface-2/40 border-border/60 text-muted-foreground'
                      : isActive
                      ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                      : 'bg-surface-1 border-border/40 text-muted-foreground/80'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isActive ? (
                    <Circle className="h-4 w-4 text-primary animate-pulse shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                      {step.title}
                    </div>
                    {step.detail && (
                      <div className="text-[11px] text-muted-foreground/70 font-mono mt-0.5 truncate">
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Files / Instances Changed in Session */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Changed Files & Remotes</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {filesChanged.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {filesChanged.map((file, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (file.code) {
                    setSelectedFileCode({ name: file.name, code: file.code });
                  }
                }}
                className="p-2.5 rounded-[8px] bg-surface-2/60 border border-border hover:border-primary/40 text-xs flex items-center justify-between cursor-pointer transition-colors"
                title="Click to view script preview"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate font-mono text-xs text-foreground">
                    {file.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {file.location.split('.')[0] || 'Studio'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Studio Connection Card */}
        <div className="surface-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span>Roblox Studio</span>
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusLights.studioConnected ? 'text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {statusLights.studioConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground space-y-1 pt-1 border-t border-border/50">
            <div className="flex justify-between">
              <span>Port:</span>
              <span className="text-foreground">4243 (127.0.0.1)</span>
            </div>
            <div className="flex justify-between">
              <span>Bridge:</span>
              <span className="text-foreground">Localhost Loopback</span>
            </div>
          </div>

          {!statusLights.studioConnected && onPairStudio && (
            <button
              type="button"
              onClick={onPairStudio}
              className="mt-2 w-full py-1.5 px-2.5 rounded-[8px] bg-primary/20 hover:bg-primary/30 text-primary hover:text-accent-text border border-primary/40 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Radio className="h-3 w-3" />
              <span>Pair with Studio</span>
            </button>
          )}
        </div>

        {/* Session Spend & Tokens Card */}
        <div className="surface-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>Spend & Tokens</span>
            </span>
            <span className="text-[11px] font-mono text-foreground font-semibold">
              ${actionState.spentBudget.toFixed(4)}
            </span>
          </div>

          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                actionState.spentBudget >= monthlyLimit * 0.9 ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{
                width: `${Math.min(100, (actionState.spentBudget / monthlyLimit) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
            <span>Budget limit:</span>
            <span>${monthlyLimit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Script Code Preview Modal if a file is clicked */}
      {selectedFileCode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="surface-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground">
                {selectedFileCode.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFileCode(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Close
              </button>
            </div>
            <pre className="p-4 overflow-y-auto text-xs font-mono bg-black/40 text-foreground/90 whitespace-pre">
              {selectedFileCode.code}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
};
