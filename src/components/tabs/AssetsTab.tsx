import React from 'react';
import { Palette, Image as ImageIcon, Sparkles, FolderArchive } from 'lucide-react';
import { Project } from '../../types';

interface AssetsTabProps {
  activeProject: Project | null;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ activeProject }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <span>Project Assets & Art Studio</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Phase 6 AI art generator: UI frames, item icons, transparent PNGs, and ZIP packaging.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          PHASE 6 PREVIEW
        </span>
      </div>

      {activeProject?.styleReferenceImage && (
        <div className="p-4 rounded-xl glass-panel flex items-center space-x-4">
          <img
            src={activeProject.styleReferenceImage}
            alt="Reference"
            className="w-16 h-16 rounded-lg object-cover border border-white/20"
          />
          <div>
            <div className="text-xs font-semibold text-white">Active Style Reference Anchor</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              All generated thumbnails, UI frames, and textures inherit this color scheme and design theme.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl glass-panel space-y-2 text-center">
          <ImageIcon className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-xs font-bold text-zinc-100">UI Frames & Borders</h3>
          <p className="text-[11px] text-zinc-400">
            Generate base shop dialogs, inventory grids, and quest banners matching style.
          </p>
        </div>
        <div className="p-5 rounded-xl glass-panel space-y-2 text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-xs font-bold text-zinc-100">Item & Pet Icons</h3>
          <p className="text-[11px] text-zinc-400">
            Transparent PNG icons generated from prompt with auto-trimmed alpha channels.
          </p>
        </div>
        <div className="p-5 rounded-xl glass-panel space-y-2 text-center">
          <FolderArchive className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-xs font-bold text-zinc-100">ZIP Export Bundle</h3>
          <p className="text-[11px] text-zinc-400">
            One-click package export ready for drag-and-drop Roblox asset manager import.
          </p>
        </div>
      </div>
    </div>
  );
};
