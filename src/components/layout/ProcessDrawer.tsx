import * as React from 'react';
import {
  Terminal,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { LogEntry } from '../../types';

interface ProcessDrawerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onPopOutLogs?: () => void;
}

export const ProcessDrawer: React.FC<ProcessDrawerProps> = ({
  logs,
  onClearLogs,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getLevelStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'warn':
        return 'text-amber-400';
      case 'success':
        return 'text-emerald-400';
      case 'cmd':
        return 'text-primary font-semibold';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div
      className={`border-t border-border bg-card transition-all duration-140 select-none flex flex-col shrink-0 ${
        isExpanded ? 'h-64' : 'h-9'
      }`}
    >
      {/* Drawer Header */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-border/40 cursor-pointer">
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground text-xs">
            Process Log
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary border border-border text-muted-foreground font-mono">
            {logs.length}
          </span>
          {/* Latest log snippet when collapsed */}
          {!isExpanded && logs.length > 0 && (
            <span className="text-muted-foreground text-[11px] font-mono truncate max-w-xl ml-4">
              [{logs[logs.length - 1].timestamp.split('T')[1]?.slice(0, 8) || ''}]{' '}
              {logs[logs.length - 1].message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearLogs();
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-140"
            title="Clear Log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-140"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      {isExpanded && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/40 select-text">
          {logs.length === 0 ? (
            <div className="text-muted-foreground py-2 text-center text-xs">
              Log is empty.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-500 shrink-0 select-none">
                  [{log.timestamp.split('T')[1]?.slice(0, 8) || ''}]
                </span>
                {log.badge && (
                  <span className="px-1 py-0.2 rounded bg-secondary text-muted-foreground border border-border text-[9px] font-mono shrink-0">
                    {log.badge}
                  </span>
                )}
                <span className={getLevelStyle(log.level)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
