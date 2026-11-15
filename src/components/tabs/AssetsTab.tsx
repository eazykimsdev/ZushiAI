import * as React from 'react';
import { Palette, Image as ImageIcon, Sparkles, FolderArchive } from 'lucide-react';
import { Project } from '../../types';

interface AssetsTabProps {
  activeProject: Project | null;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ activeProject }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Asset Studio</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            UI frames, item icons, transparent textures, and ZIP bundles.
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          Phase 6 Preview
        </span>
      </div>

      {activeProject?.styleReferenceImage && (
        <div className="surface-card p-4 flex items-center gap-4">
          <img
            src={activeProject.styleReferenceImage}
            alt="Reference"
            className="h-14 w-14 rounded-md object-cover border border-border"
          />
          <div>
            <div className="text-xs font-semibold text-foreground">Active Style Reference</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Generated UI frames, icons, and textures inherit this visual theme.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="surface-card p-4 space-y-2 text-center">
          <ImageIcon className="h-6 w-6 text-primary mx-auto" />
          <h3 className="text-xs font-medium text-foreground">UI Frames & Dialogs</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Generate shop dialogs, inventory cards, and quest banners matching style.
          </p>
        </div>
        <div className="surface-card p-4 space-y-2 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <h3 className="text-xs font-medium text-foreground">Item & Pet Icons</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Transparent PNG icons generated from prompt with trimmed alpha channels.
          </p>
        </div>
        <div className="surface-card p-4 space-y-2 text-center">
          <FolderArchive className="h-6 w-6 text-primary mx-auto" />
          <h3 className="text-xs font-medium text-foreground">ZIP Export Package</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Package export ready for drag-and-drop Roblox Studio Asset Manager import.
          </p>
        </div>
      </div>
    </div>
  );
};
