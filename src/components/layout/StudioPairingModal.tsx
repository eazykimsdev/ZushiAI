import * as React from 'react';
import { Radio, ShieldCheck, Check, X } from 'lucide-react';

interface StudioPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllowPairing: () => void;
}

export const StudioPairingModal: React.FC<StudioPairingModalProps> = ({
  isOpen,
  onClose,
  onAllowPairing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="surface-card w-full max-w-md p-6 border border-border shadow-2xl rounded-[12px] space-y-5 animate-in fade-in zoom-in-95 duration-140">
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-[10px] bg-primary/10 border border-primary/20 text-primary">
              <Radio className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Roblox Studio Wants to Connect
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Roblox Studio running on this machine requested a direct bridge to push Luau scripts and RemoteEvents.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 rounded-[8px] bg-surface-2/60 border border-border/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero Token Typing · Localhost Loopback</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Binds exclusively to <code className="font-mono text-foreground">127.0.0.1:4243</code>. No external network traffic or public internet exposure.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-xs font-medium bg-surface-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => {
              onAllowPairing();
              onClose();
            }}
            className="px-4 py-2 rounded-[8px] text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Allow & Pair Forever</span>
          </button>
        </div>
      </div>
    </div>
  );
};
