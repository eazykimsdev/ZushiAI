import * as React from 'react';
import {
  Hammer,
  FolderOpen,
  Plus,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Project, StatusLights, TabId } from '../../types';

interface DashboardTabProps {
  activeProject: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  onEditActiveProject: () => void;
  setActiveTab: (tab: TabId) => void;
  statusLights: StatusLights;
  spentBudget: number;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onEditActiveProject,
  setActiveTab,
  statusLights,
  spentBudget: _spentBudget,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* 1. HERO: Active Project Header with ONE primary button */}
      {activeProject ? (
        <div className="surface-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {activeProject.styleReferenceImage ? (
              <img
                src={activeProject.styleReferenceImage}
                alt={activeProject.name}
                className="h-16 w-16 rounded-[10px] object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-[10px] bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Layers className="h-7 w-7 text-primary" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  {activeProject.name}
                </h1>
                <span className="text-[11px] font-mono text-muted-foreground">
                  ({activeProject.genre})
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-lg leading-relaxed">
                {activeProject.notes || 'No gameplay notes set. Click Edit to add mechanics requirements.'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                <span>Created {new Date(activeProject.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={onEditActiveProject}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors duration-140"
                >
                  Edit details
                </button>
              </div>
            </div>
          </div>

          {/* ONE Primary Hero Action */}
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors duration-140 shrink-0 shadow-sm"
          >
            <Hammer className="h-4 w-4" />
            <span>Launch AI Builder</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="surface-card p-8 text-center space-y-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-sm font-semibold text-foreground">No Project Selected</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create or choose a Roblox project to start engineering Luau game systems.
          </p>
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors duration-140"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      )}

      {/* 2. COMPACT STATUS ROW: Key / Studio / Vault as small dots with text */}
      <div className="surface-card px-4 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          {/* Key status */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('settings')}
            title="Configure API key"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                statusLights.keyConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-foreground font-medium">Key</span>
            <span className="text-muted-foreground text-[11px]">
              {statusLights.keyConnected ? 'Connected' : 'Missing'}
            </span>
          </div>

          <div className="h-3 w-px bg-border" />

          {/* Studio status */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('builder')}
            title="Studio connection bridge"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                statusLights.studioConnected ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className="text-foreground font-medium">Studio</span>
            <span className="text-muted-foreground text-[11px]">
              {statusLights.studioConnected ? 'Paired' : 'Ready'}
            </span>
          </div>

          <div className="h-3 w-px bg-border" />

          {/* Vault status */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('settings')}
            title="LihFolk Engineering Vault"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                statusLights.vaultLoaded ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className="text-foreground font-medium">Vault</span>
            <span className="text-muted-foreground text-[11px]">
              {statusLights.vaultLoaded ? '1,300+ Notes' : 'Not Loaded'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-140"
        >
          Manage settings
        </button>
      </div>

      {/* 3. PROJECT LIST */}
      <div className="surface-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Projects
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ({projects.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-secondary hover:bg-muted text-foreground text-xs font-medium border border-border transition-colors duration-140"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No projects yet. Click "New Project" to start your first game.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {projects.map((p) => {
              const isCurrent = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`surface-card-interactive p-3 flex items-center justify-between cursor-pointer ${
                    isCurrent ? 'border-primary/50 bg-secondary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {p.styleReferenceImage ? (
                      <img
                        src={p.styleReferenceImage}
                        alt={p.name}
                        className="h-9 w-9 rounded-md object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {p.name.charAt(0)}
                      </div>
                    )}

                    <div className="truncate">
                      <div className="text-xs font-medium text-foreground truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {p.genre}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {isCurrent ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Current</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
