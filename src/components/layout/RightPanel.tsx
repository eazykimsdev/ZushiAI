import React from 'react';
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
  const getStatusBadge = () => {
    switch (actionState.status) {
      case 'executing':
      case 'planning':
      case 'fixing':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>LIVE: {actionState.status.toUpperCase()}</span>
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>PAUSED</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>ERROR</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            <span>IDLE / READY</span>
          </span>
        );
    }
  };

  const isRunning =
    actionState.status === 'executing' ||
    actionState.status === 'planning' ||
    actionState.status === 'fixing';

  return (
    <aside className="w-80 border-l border-white/10 bg-[#0a0b12]/80 backdrop-blur-md flex flex-col select-none h-full overflow-hidden">
      {/* Top: Controls bar (Start, Pause, Stop) */}
      <div className="p-3 border-b border-white/10 bg-black/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Execution Controls
          </span>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onStartAgent}
            disabled={isRunning}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              isRunning
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 cursor-not-allowed opacity-60'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START</span>
          </button>

          <button
            onClick={onPauseAgent}
            disabled={!isRunning}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              !isRunning
                ? 'bg-amber-500/10 text-amber-500/40 border border-white/5 cursor-not-allowed'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95'
            }`}
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>PAUSE</span>
          </button>

          <button
            onClick={onStopAgent}
            disabled={actionState.status === 'idle'}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              actionState.status === 'idle'
                ? 'bg-rose-500/10 text-rose-500/40 border border-white/5 cursor-not-allowed'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 active:scale-95'
            }`}
          >
            <Square className="w-3 h-3 fill-current" />
            <span>STOP</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Status Readout */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Status Readout
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2.5">
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-500">Current Action</div>
              <div className="text-xs font-medium text-zinc-200 mt-0.5 truncate">
                {actionState.currentAction || 'Awaiting prompt from user'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-500">Task Step</div>
                <div className="text-xs font-mono font-semibold text-indigo-300 mt-0.5">
                  {actionState.taskCurrent} / {actionState.taskTotal}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-500">Last Run</div>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">
                  {actionState.lastRunTime || 'Never'}
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-zinc-500 mb-1">
                <span>Spent Budget</span>
                <span className="text-zinc-300">
                  ${actionState.spentBudget.toFixed(4)} / ${monthlyLimit.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    actionState.spentBudget >= monthlyLimit * 0.9
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
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
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Session Scoreboard
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-500">Total Runs</div>
              <div className="text-lg font-mono font-bold text-zinc-100 mt-0.5">
                {scoreboard.totalRuns}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-500">Success Rate</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                {scoreboard.successRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Run History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Run History
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {runHistory.length} calls
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {runHistory.length === 0 ? (
              <div className="p-3 rounded-md bg-black/30 border border-white/5 text-center text-xs text-zinc-500 font-mono">
                No runs recorded in session yet.
              </div>
            ) : (
              runHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-300 truncate max-w-[150px]">
                      {item.taskPrompt}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        item.status === 'success'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{item.model}</span>
                    <span className="text-indigo-400 font-semibold">
                      ${item.estimatedCost.toFixed(4)}
                    </span>
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
