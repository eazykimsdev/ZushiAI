import * as React from 'react';
import { Key, Radio, FolderCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatusLights, TabId, UserSettings } from '../../types';
import { AttachmentComposerTray, AttachedFile } from '../ui/attachment-composer-tray';

interface HomeTabProps {
  statusLights: StatusLights;
  settings: UserSettings;
  setActiveTab: (tab: TabId) => void;
  onLaunchBuild: (prompt: string, attachments?: AttachedFile[]) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  statusLights,
  setActiveTab,
  onLaunchBuild,
}) => {
  const [promptInput, setPromptInput] = React.useState('');

  const exampleChips = [
    'Pet hatching simulator with rarities and luck boosts',
    'Sword combat arena with combos, parry, and hitboxes',
    'Obby with checkpoints, stage saving, and timer',
    'Tycoon with droppers, conveyors, and rebirths',
    'Shop UI with Robux items and developer products',
  ];

  const allReady = statusLights.keyConnected && statusLights.studioConnected && statusLights.vaultLoaded;

  const handleSubmit = (text: string, attachments: AttachedFile[]) => {
    if (!text.trim() && attachments.length === 0) return;
    onLaunchBuild(text, attachments);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full select-none">
      {/* 3-Step Setup Checklist for First Run */}
      {!allReady && (
        <div className="w-full mb-8 p-3.5 rounded-[12px] surface-card border border-border/80 bg-surface-1/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Getting Started</span>
            <span className="text-[11px] text-muted-foreground font-mono">3 Steps</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Step 1: Key */}
            <div
              onClick={() => !statusLights.keyConnected && setActiveTab('settings')}
              className={`p-2.5 rounded-[10px] border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                statusLights.keyConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-background hover:bg-secondary border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusLights.keyConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Key className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="font-medium">1. Add API Key</span>
              </div>
              {!statusLights.keyConnected && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>

            {/* Step 2: Studio */}
            <div
              onClick={() => !statusLights.studioConnected && setActiveTab('settings')}
              className={`p-2.5 rounded-[10px] border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                statusLights.studioConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-background hover:bg-secondary border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusLights.studioConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Radio className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="font-medium">2. Connect Studio</span>
              </div>
              {!statusLights.studioConnected && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>

            {/* Step 3: Vault */}
            <div
              onClick={() => !statusLights.vaultLoaded && setActiveTab('settings')}
              className={`p-2.5 rounded-[10px] border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                statusLights.vaultLoaded
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-background hover:bg-secondary border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusLights.vaultLoaded ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <FolderCheck className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="font-medium">3. Load Vault</span>
              </div>
              {!statusLights.vaultLoaded && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
        </div>
      )}

      {/* Hero Headline (Calm Serif) */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
          What are we building?
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Describe a Roblox game. ZushiAI writes the Luau, connects the remotes, and pushes it to Studio.
        </p>
      </div>

      {/* Center Big Composer */}
      <div className="w-full">
        <AttachmentComposerTray
          value={promptInput}
          onChange={setPromptInput}
          onSubmit={handleSubmit}
          onStop={() => {}}
          isLoading={false}
          placeholder="Describe your Roblox game mechanic, system, or complete world..."
        />
      </div>

      {/* 5 Quiet Inspiration Chips */}
      <div className="w-full mt-6">
        <div className="text-[11px] font-medium text-muted-foreground mb-2 px-1">
          Inspiration
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPromptInput(chip)}
              className="text-xs px-3 py-1.5 rounded-[10px] bg-surface-1 hover:bg-surface-2 border border-border text-foreground/90 hover:text-foreground text-left transition-colors duration-140"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
