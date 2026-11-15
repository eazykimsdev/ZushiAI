import * as React from 'react';
import {
  LayoutDashboard,
  Hammer,
  Palette,
  Star,
  Settings,
  FolderOpen,
  Plus,
  Clock,
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
  monthlyLimit: _monthlyLimit,
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  // Session timer
  React.useEffect(() => {
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
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'builder', label: 'Builder', icon: <Hammer className="h-4 w-4" /> },
    { id: 'assets', label: 'Assets', icon: <Palette className="h-4 w-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <header className="h-13 border-b border-border bg-card px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Brand + Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            L
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            LihForge
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            v0.1.0
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Project Selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] bg-secondary hover:bg-muted border border-border text-xs text-foreground transition-colors duration-140"
          >
            {activeProject?.styleReferenceImage ? (
              <img
                src={activeProject.styleReferenceImage}
                alt="Style"
                className="h-3.5 w-3.5 rounded object-cover"
              />
            ) : (
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="max-w-[150px] truncate font-medium">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {projectDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 rounded-[10px] bg-card border border-border py-1.5 z-50 text-xs shadow-lg"
              onMouseLeave={() => setProjectDropdownOpen(false)}
            >
              <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground">
                Projects ({projects.length})
              </div>
              <div className="max-h-56 overflow-y-auto py-1 divide-y divide-border/30">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(p);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-muted transition-colors duration-140 ${
                      activeProject?.id === p.id ? 'bg-secondary text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {p.styleReferenceImage ? (
                        <img
                          src={p.styleReferenceImage}
                          alt="Style"
                          className="h-4 w-4 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">{p.genre}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border pt-1 mt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    onOpenNewProjectModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-primary transition-colors duration-140 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Project</span>
                </button>
                {activeProject && (
                  <button
                    type="button"
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      onEditActiveProject();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-140 text-xs"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Project Settings</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Tabs with underline for active */}
      <nav className="flex items-center h-full gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3 h-full text-xs font-medium transition-colors duration-140 border-b-2 ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Three status indicators + Session timer + Spend (Plain Text) */}
      <div className="flex items-center gap-4 text-xs">
        {/* Status dots row */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          {/* Key */}
          <div className="flex items-center gap-1.5" title="AI Provider Key">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusLights.keyConnected ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.keyConnected ? 'text-foreground' : 'text-muted-foreground'}>
              Key
            </span>
          </div>

          {/* Studio */}
          <div className="flex items-center gap-1.5" title="Roblox Studio Bridge">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusLights.studioConnected ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.studioConnected ? 'text-foreground' : 'text-muted-foreground'}>
              Studio
            </span>
          </div>

          {/* Vault */}
          <div className="flex items-center gap-1.5" title="Knowledge Vault">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusLights.vaultLoaded ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className={statusLights.vaultLoaded ? 'text-foreground' : 'text-muted-foreground'}>
              Vault
            </span>
          </div>
        </div>

        <div className="h-3 w-px bg-border" />

        {/* Session Timer (Plain Text) */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-[12px]">{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Spend (Plain Text) */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Spend:</span>
          <span className="font-mono text-foreground text-[12px] tabular-nums">
            ${spentBudget.toFixed(4)}
          </span>
        </div>
      </div>
    </header>
  );
};
