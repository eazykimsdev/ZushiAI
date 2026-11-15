import React from 'react';
import { Star, Code } from 'lucide-react';

export const FavoritesTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span>Favorites & Saved Macros</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pin frequently used Luau snippets, macro recipes, and game system boilerplates.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          SAVED SNIPPETS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Safe DataStore Wrapper (Luau)</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
              MODULE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Standard ProfileService / DataStore2 style boilerplate with retry loops and auto-save.
          </p>
        </div>

        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure RemoteEvent Rate-Limiter</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              SECURITY
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Authoritative token bucket rate-limiter rejecting flooded client remote calls.
          </p>
        </div>
      </div>
    </div>
  );
};
