import * as React from 'react';
import {
  Play,
  Pause,
  Square,
  Activity,
  History,
  TrendingUp,
} from 'lucide-react';
import { AgentActionState, RunHistoryRecord, Scoreboard } from '../../types';

interface RightPanelProps {
  actionState: AgentActionState;
  scoreboard: Scoreboard;
  runHistory: RunHistoryRecord[];
  onStartAgent?: () => void;
  onPauseAgent?: () => void;
  onStopAgent?: () => void;
  monthlyLimit: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  actionState,
  scoreboard,
  runHistory,
  onStartAgent,
  onPauseAgent,
  onStopAgent,
  monthlyLimit,
}) => {
  const isRunning =
    actionState.status === 'executing' ||
    actionState.status === 'planning' ||
    actionState.status === 'fixing';

  const getStatusIndicator = () => {
    switch (actionState.status) {
      case 'executing':
      case 'planning':
      case 'fixing':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Working</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Paused</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-zinc-600" />
            <span>Ready</span>
          </div>
        );
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col select-none h-full overflow-hidden shrink-0">
      {/* Top: Controls bar */}
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Execution
          </span>
          {getStatusIndicator()}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onStartAgent}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[10px] text-xs font-medium transition-colors duration-140 ${
              isRunning
                ? 'bg-secondary text-muted-foreground border border-border opacity-50 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start</span>
          </button>

          <button
            type="button"
            onClick={onPauseAgent}
            disabled={!isRunning}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[10px] text-xs font-medium transition-colors duration-140 ${
              !isRunning
                ? 'bg-secondary text-muted-foreground border border-border opacity-50 cursor-not-allowed'
                : 'bg-secondary hover:bg-muted text-foreground border border-border'
            }`}
          >
            <Pause className="h-3.5 w-3.5 fill-current" />
            <span>Pause</span>
          </button>

          <button
            type="button"
            onClick={onStopAgent}
            disabled={actionState.status === 'idle'}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[10px] text-xs font-medium transition-colors duration-140 ${
              actionState.status === 'idle'
                ? 'bg-secondary text-muted-foreground border border-border opacity-50 cursor-not-allowed'
                : 'bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30'
            }`}
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Status Readout */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span>Status Readout</span>
          </div>

          <div className="p-3 rounded-[10px] bg-secondary/60 border border-border space-y-2 text-xs">
            <div>
              <div className="text-[11px] text-muted-foreground">Current Action</div>
              <div className="text-xs font-medium text-foreground mt-0.5 truncate">
                {actionState.currentAction || 'Ready for user prompt'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div>
                <div className="text-[11px] text-muted-foreground">Step</div>
                <div className="text-xs font-mono font-semibold text-foreground mt-0.5">
                  {actionState.taskCurrent} / {actionState.taskTotal}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Last Run</div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  {actionState.lastRunTime || 'Never'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Budget Spent</span>
                <span className="font-mono text-foreground text-[11px]">
                  ${actionState.spentBudget.toFixed(4)} / ${monthlyLimit.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    actionState.spentBudget >= monthlyLimit * 0.9
                      ? 'bg-destructive'
                      : 'bg-primary'
                  }`}
                  style={{
                    width: `${Math.min(100, (actionState.spentBudget / monthlyLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Session Scoreboard */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Session Scoreboard</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-[10px] bg-secondary/60 border border-border text-center">
              <div className="text-[11px] text-muted-foreground">Total Runs</div>
              <div className="text-base font-mono font-semibold text-foreground mt-0.5">
                {scoreboard.totalRuns === 0 ? '-' : scoreboard.totalRuns}
              </div>
            </div>
            <div className="p-3 rounded-[10px] bg-secondary/60 border border-border text-center">
              <div className="text-[11px] text-muted-foreground">Success Rate</div>
              <div className="text-base font-mono font-semibold text-emerald-400 mt-0.5">
                {scoreboard.totalRuns === 0 ? '-' : `${scoreboard.successRate}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Run History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Run History</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {runHistory.length} calls
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {runHistory.length === 0 ? (
              <div className="p-4 rounded-[10px] bg-secondary/30 border border-border text-center text-xs text-muted-foreground">
                No runs yet. Launch the builder to start.
              </div>
            ) : (
              runHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-[10px] bg-secondary/50 border border-border hover:bg-secondary transition-colors duration-140 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate max-w-[170px]">
                      {item.taskPrompt}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        item.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span>${item.estimatedCost.toFixed(4)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
