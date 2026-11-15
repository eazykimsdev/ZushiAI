import React, { useState } from 'react';
import {
  Terminal,
  Trash2,
  ExternalLink,
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
  onPopOutLogs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getLevelStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-rose-400 font-bold';
      case 'warn':
        return 'text-amber-400';
      case 'success':
        return 'text-emerald-400';
      case 'cmd':
        return 'text-cyan-400 font-bold';
      default:
        return 'text-zinc-300';
    }
  };

  return (
    <div
      className={`border-t border-white/10 bg-[#090a10]/95 backdrop-blur-md transition-all duration-200 select-none flex flex-col ${
        isExpanded ? 'h-64' : 'h-10'
      }`}
    >
      {/* Drawer Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 cursor-pointer">
        <div
          className="flex items-center space-x-2 text-xs font-mono text-zinc-300 flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
            Process Log
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">
            {logs.length} lines
          </span>
          {/* Latest log sneak peek when collapsed */}
          {!isExpanded && logs.length > 0 && (
            <span className="text-zinc-500 text-[11px] font-mono truncate max-w-xl ml-4">
              [{logs[logs.length - 1].timestamp.split('T')[1]?.slice(0, 8) || ''}]{' '}
              {logs[logs.length - 1].message}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearLogs();
            }}
            className="p-1 rounded text-zinc-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
            title="Clear Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPopOutLogs?.();
            }}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Pop Out"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      {isExpanded && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/60 select-text">
          {logs.length === 0 ? (
            <div className="text-zinc-500 italic">No logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2.5 leading-relaxed">
                <span className="text-zinc-600 flex-shrink-0">
                  {log.timestamp.includes('T')
                    ? log.timestamp.split('T')[1].slice(0, 8)
                    : log.timestamp}
                </span>
                <span className={`flex-shrink-0 uppercase font-bold text-[10px] px-1 py-0.2 rounded bg-white/[0.04] border border-white/5 ${getLevelStyle(log.level)}`}>
                  {log.level}
                </span>
                {log.badge && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {log.badge}
                  </span>
                )}
                <span className={`${getLevelStyle(log.level)} flex-1 break-all`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
