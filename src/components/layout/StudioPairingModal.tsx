import * as React from 'react';
import { Radio, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface StudioPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the real result of every bridge check. */
  onResult: (connected: boolean) => void;
  connected: boolean;
}

/** Real Studio bridge check against 127.0.0.1:4243. Nothing is marked connected unless the bridge answers. */
export const StudioPairingModal: React.FC<StudioPairingModalProps> = ({ isOpen, onClose, onResult, connected }) => {
  const [checking, setChecking] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState<'ok' | 'fail' | null>(null);

  React.useEffect(() => {
    if (isOpen) setLastChecked(null);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const check = async () => {
    setChecking(true);
    const ok = await api.checkStudioConnection().catch(() => false);
    setChecking(false);
    setLastChecked(ok ? 'ok' : 'fail');
    onResult(ok);
  };

  const steps = [
    'Open Roblox Studio and the place you want to build in.',
    'In the ZushiAI plugin, press Connect. It talks to this app over your own machine only.',
    'Press Check connection below.',
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Connect Roblox Studio" className="fade-up w-full max-w-md rounded-[16px] border border-border-hover bg-surface-1 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-primary-soft text-accent-text flex items-center justify-center">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-foreground leading-tight">Connect Roblox Studio</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Local bridge on 127.0.0.1:4243</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[13px] text-muted-foreground leading-relaxed">
              <span className="font-mono text-[12px] h-5 w-5 shrink-0 rounded-full border border-border-hover flex items-center justify-center text-foreground mt-0.5">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <div
          className={`mt-5 flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px] ${
            connected
              ? 'border-success/30 bg-success/10 text-success'
              : lastChecked === 'fail'
              ? 'border-error/30 bg-error/10 text-error'
              : 'border-border bg-surface-2 text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {connected ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : lastChecked === 'fail' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Radio className="h-4 w-4 shrink-0" />}
          <span>
            {connected
              ? 'Studio bridge is answering.'
              : lastChecked === 'fail'
              ? 'Nothing answered on port 4243. Make sure the plugin is running in Studio.'
              : 'Not checked yet.'}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-[10px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer">
            Close
          </button>
          <button
            type="button"
            onClick={check}
            disabled={checking}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking' : 'Check connection'}
          </button>
        </div>
      </div>
    </div>
  );
};
