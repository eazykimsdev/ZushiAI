import React from 'react';
import {
  Hammer,
  FolderOpen,
  Plus,
  Layers,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Database,
  Radio,
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
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 select-none">
      {/* Hero: Active Project Showcase */}
      {activeProject ? (
        <div className="relative rounded-2xl glass-panel border border-white/15 overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              {activeProject.styleReferenceImage ? (
                <div className="relative group">
                  <img
                    src={activeProject.styleReferenceImage}
                    alt={activeProject.name}
                    className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-lg shadow-black/60"
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-zinc-300 border border-white/10">
                    STYLE
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-indigo-950 via-purple-900 to-zinc-900 border border-white/15 flex items-center justify-center text-zinc-300 shadow-inner">
                  <Layers className="w-8 h-8 text-indigo-400" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {activeProject.name}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeProject.genre}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 max-w-xl leading-relaxed">
                  {activeProject.notes || 'No custom gameplay brief set yet. Click Edit to add mechanics notes.'}
                </p>
                <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono pt-1">
                  <span>SQLite ID: {activeProject.id.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>Created: {new Date(activeProject.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('builder')}
                className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <Hammer className="w-4 h-4" />
                <span>Launch AI Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onEditActiveProject}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Edit Project & Style
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl glass-panel border border-white/15 text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-zinc-500 mx-auto" />
          <h2 className="text-base font-bold text-white">No Project Selected</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Create your first Roblox game project to start planning, writing Luau scripts,
            and connecting to Studio.
          </p>
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      )}

      {/* Grid: System Status & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status card: Key */}
        <div
          onClick={() => setActiveTab('settings')}
          className="p-4 rounded-xl glass-panel-interactive cursor-pointer flex items-center space-x-3.5"
        >
          <div
            className={`p-2.5 rounded-lg border ${
              statusLights.keyConnected
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800 border-white/10 text-zinc-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-500">BYOK Provider</div>
            <div className="text-xs font-semibold text-zinc-100 flex items-center space-x-1.5">
              <span>{statusLights.keyConnected ? 'Key Active in Keychain' : 'Setup API Key'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  statusLights.keyConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Click to configure models</div>
          </div>
        </div>

        {/* Status card: Studio */}
        <div
          onClick={() => setActiveTab('builder')}
          className="p-4 rounded-xl glass-panel-interactive cursor-pointer flex items-center space-x-3.5"
        >
          <div
            className={`p-2.5 rounded-lg border ${
              statusLights.studioConnected
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800 border-white/10 text-zinc-500'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-500">Roblox Studio</div>
            <div className="text-xs font-semibold text-zinc-100 flex items-center space-x-1.5">
              <span>{statusLights.studioConnected ? 'Bridge Paired' : 'Bridge Ready (Phase 4)'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  statusLights.studioConnected ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Localhost loopback paired</div>
          </div>
        </div>

        {/* Status card: Vault */}
        <div
          onClick={() => setActiveTab('settings')}
          className="p-4 rounded-xl glass-panel-interactive cursor-pointer flex items-center space-x-3.5"
        >
          <div
            className={`p-2.5 rounded-lg border ${
              statusLights.vaultLoaded
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800 border-white/10 text-zinc-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-500">Knowledge Vault</div>
            <div className="text-xs font-semibold text-zinc-100 flex items-center space-x-1.5">
              <span>{statusLights.vaultLoaded ? '1,300+ Notes Ready' : 'Indexed (Phase 3)'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  statusLights.vaultLoaded ? 'bg-emerald-400' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">LihFolk Vault V2 embedded</div>
          </div>
        </div>
      </div>

      {/* Projects List in SQLite */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              All Local Projects (SQLite)
            </h3>
          </div>
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => {
            const isCurrent = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  {p.styleReferenceImage ? (
                    <img
                      src={p.styleReferenceImage}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover border border-white/15 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  <div className="truncate">
                    <div className="text-xs font-semibold text-zinc-100 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {p.genre}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {isCurrent && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      CURRENT
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
