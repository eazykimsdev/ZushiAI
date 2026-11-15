import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Hammer,
  Palette,
  Star,
  Settings,
  FolderOpen,
  Plus,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Project, StatusLights, TabId } from '../../types';

interface TopBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  activeProject: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  onEditActiveProject: () => void;
  statusLights: StatusLights;
  spentBudget: number;
  monthlyLimit: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onEditActiveProject,
  statusLights,
  spentBudget,
  monthlyLimit,
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'builder', label: 'Builder', icon: <Hammer className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <Palette className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="h-14 border-b border-white/10 bg-[#0c0d14]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand + Project Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-1.5">
            LIHFORGE
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v0.1.0-alpha
            </span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Project Selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
          >
            {activeProject?.styleReferenceImage ? (
              <img
                src={activeProject.styleReferenceImage}
                alt="Style"
                className="w-4 h-4 rounded object-cover border border-white/20"
              />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="max-w-[140px] truncate font-semibold">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            {activeProject && (
              <span className="text-[10px] text-zinc-400 font-mono px-1 py-0.2 rounded bg-black/40 border border-white/5">
                {activeProject.genre}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {projectDropdownOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-lg bg-[#121420] border border-white/15 shadow-2xl shadow-black/80 py-1.5 z-50 text-xs"
              onMouseLeave={() => setProjectDropdownOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                Projects ({projects.length})
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/10 transition-colors ${
                      activeProject?.id === p.id ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {p.styleReferenceImage ? (
                        <img
                          src={p.styleReferenceImage}
                          alt="Style"
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-400">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{p.genre}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 pt-1 mt-1 px-1">
                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    onOpenNewProjectModal();
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-indigo-600/30 text-indigo-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
                {activeProject && (
                  <button
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      onEditActiveProject();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Project Settings & Style Reference</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Tabs Switcher */}
      <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-sm shadow-indigo-500/20 border border-indigo-400/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Three Status Indicators + Session Timer + Spend */}
      <div className="flex items-center space-x-3.5">
        {/* Three Status Indicators */}
        <div className="flex items-center space-x-2 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-mono">
          {/* Key Connected */}
          <div className="flex items-center space-x-1.5" title="AI Provider Key (BYOK)">
            <span
              className={`w-2 h-2 rounded-full ${
                statusLights.keyConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.keyConnected ? 'text-zinc-300' : 'text-zinc-500'}>
              KEY
            </span>
          </div>

          <div className="w-px h-3 bg-white/10" />

          {/* Studio Connected */}
          <div className="flex items-center space-x-1.5" title="Roblox Studio Plugin Bridge">
            <span
              className={`w-2 h-2 rounded-full ${
                statusLights.studioConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.studioConnected ? 'text-zinc-300' : 'text-zinc-500'}>
              STUDIO
            </span>
          </div>

          <div className="w-px h-3 bg-white/10" />

          {/* Vault Loaded */}
          <div className="flex items-center space-x-1.5" title="LihFolk Knowledge Vault">
            <span
              className={`w-2 h-2 rounded-full ${
                statusLights.vaultLoaded
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.vaultLoaded ? 'text-zinc-300' : 'text-zinc-500'}>
              VAULT
            </span>
          </div>
        </div>

        {/* Session Timer */}
        <div className="flex items-center space-x-1.5 text-xs font-mono text-zinc-400 bg-white/[0.02] px-2.5 py-1 rounded-md border border-white/5">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Budget limit pill */}
        <div
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs font-mono ${
            spentBudget >= monthlyLimit * 0.9
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
          }`}
          title="Session / Monthly Estimated Token Spend"
        >
          <span className="text-[10px] text-zinc-500 font-sans uppercase">Spend:</span>
          <span>${spentBudget.toFixed(4)}</span>
        </div>
      </div>
    </header>
  );
};
