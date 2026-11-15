import * as React from 'react';
import { ChevronDown, Search, Check, RefreshCw, Cpu, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '../../lib/api';
import { LiveModelInfo, ProviderId, PROVIDERS } from '../../../providers/types';

interface ModelPickerProps {
  provider: ProviderId;
  hasKey: boolean;
  value: string;
  onChange: (modelId: string) => void;
  onNeedKey: () => void;
  /** Open the menu above the button (use in bottom-pinned composers). */
  placement?: 'top' | 'bottom';
}

/**
 * Model dropdown filled from the provider's live model list (never a hardcoded list).
 * Loads after a key is saved, searchable, remembers nothing silently.
 */
export const ModelPicker: React.FC<ModelPickerProps> = ({ provider, hasKey, value, onChange, onNeedKey, placement = 'bottom' }) => {
  const [open, setOpen] = React.useState(false);
  const [models, setModels] = React.useState<LiveModelInfo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    if (!hasKey) {
      setModels([]);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const list = await api.fetchLiveModels(provider);
      setModels(list || []);
      setFailed(!list || list.length === 0);
    } catch {
      setModels([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [provider, hasKey]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = models.find((m) => m.id === value);
  const label = selected?.name || value || 'Choose a model';

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) : models;
    return list.slice(0, 80);
  }, [models, query]);

  if (!hasKey) {
    return (
      <button
        type="button"
        onClick={onNeedKey}
        className="h-8 px-2.5 inline-flex items-center gap-2 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Add a key to pick a model
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-8 max-w-[260px] px-2.5 inline-flex items-center gap-2 rounded-[8px] text-[12px] text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className={cn('truncate', !value && 'text-muted-foreground')}>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-0 z-40 w-[340px] rounded-[12px] border border-border-hover bg-surface-1 fade-up',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${PROVIDERS[provider]?.name.split(' (')[0] || 'provider'} models`}
                className="w-full h-9 rounded-[8px] bg-background border border-border pl-8 pr-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div role="listbox" className="max-h-[300px] overflow-y-auto p-1.5">
            {loading && <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">Loading models from your provider</div>}

            {!loading && failed && (
              <div className="px-3 py-5 text-center space-y-3">
                <p className="text-[12px] text-muted-foreground leading-relaxed">Could not load the model list. Check your key and connection.</p>
                <button
                  type="button"
                  onClick={load}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[8px] border border-border hover:border-border-hover text-[12px] text-foreground cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            )}

            {!loading && !failed && shown.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">No models match that search.</div>
            )}

            {!loading &&
              shown.map((m) => {
                const active = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition-colors cursor-pointer',
                      active ? 'bg-primary-soft' : 'hover:bg-surface-2'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-foreground">{m.name}</div>
                      <div className="truncate text-[11px] font-mono text-muted-foreground">
                        {m.id}
                        {m.contextLength ? ` · ${Math.round(m.contextLength / 1000)}k ctx` : ''}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-accent-text shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
