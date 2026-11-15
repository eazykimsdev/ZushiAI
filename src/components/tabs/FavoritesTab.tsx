import * as React from 'react';
import { Star, Code } from 'lucide-react';

export const FavoritesTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span>Favorites & Saved Macros</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pin frequently used Luau snippets and game system boilerplates.
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          2 snippets
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="surface-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              <span>Safe DataStore Manager (Luau)</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Module
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            ProfileService-style boilerplate with session locks, retry loops, and BindToClose budget.
          </p>
        </div>

        <div className="surface-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              <span>Secure RemoteEvent Rate-Limiter</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Security
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Authoritative token bucket rate-limiter rejecting flooded client RemoteEvent calls.
          </p>
        </div>
      </div>
    </div>
  );
};
