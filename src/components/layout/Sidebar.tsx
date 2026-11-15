import * as React from 'react';
import {
  Plus,
  Search,
  Settings,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Project, StatusLights } from '../../types';

interface SidebarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNewBuild: () => void;
  onRenameProject: (id: string, newName: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  statusLights: StatusLights;
  onOpenSettings: () => void;
  onFixStatus: (type: 'key' | 'studio' | 'vault') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onNewBuild,
  onRenameProject,
  onDeleteProject,
  statusLights,
  onOpenSettings,
  onFixStatus,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.genre && p.genre.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const handleStartRename = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = async (id: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (!editName.trim()) return;
    await onRenameProject(id, editName.trim());
    setEditingProjectId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onDeleteProject(id);
  };

  return (
    <aside
      className={`border-r border-border bg-surface-1 flex flex-col select-none transition-all duration-200 h-full shrink-0 z-20 ${
        collapsed ? 'w-14' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-13 border-b border-border px-3.5 flex items-center justify-between shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 truncate">
            <img
              src="/logo.png"
              alt="ZushiAI"
              className="h-6 w-6 rounded-md object-contain shrink-0"
              onError={(e) => {
                // Text wordmark fallback if image fails to render
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm tracking-tight text-foreground">
              ZushiAI
            </span>
          </div>
        ) : (
          <img
            src="/logo.png"
            alt="Z"
            className="h-6 w-6 mx-auto rounded-md object-contain"
          />
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[6px] hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* New Build Action */}
      <div className="p-3 border-b border-border/50 shrink-0">
        <button
          type="button"
          onClick={onNewBuild}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-sm ${
            collapsed ? 'px-0' : ''
          }`}
          title="Start a new build"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New build</span>}
        </button>
      </div>

      {/* Search Input (When expanded) */}
      {!collapsed && (
        <div className="px-3 pt-2.5 pb-1 shrink-0">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builds..."
              className="w-full bg-surface-2 border border-border rounded-[8px] pl-8 pr-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
            />
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {!collapsed && (
          <div className="px-2 pt-1 pb-1 text-[11px] font-medium text-muted-foreground">
            Recent builds
          </div>
        )}

        {filteredProjects.length === 0 ? (
          !collapsed && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground leading-relaxed">
              No builds yet.
              <br />
              <span className="text-[11px] opacity-75">Click "New build" to start.</span>
            </div>
          )
        ) : (
          filteredProjects.map((project) => {
            const isSelected = activeProject?.id === project.id;
            const isEditing = editingProjectId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-[8px] text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-2 text-foreground font-medium border border-border/80'
                    : 'text-muted-foreground hover:bg-surface-2/60 hover:text-foreground'
                }`}
                title={project.name}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-1">
                  <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  {!collapsed && (
                    isEditing ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(project.id)}
                          autoFocus
                          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground flex-1 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(project.id, e)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate">{project.name}</span>
                    )
                  )}
                </div>

                {!collapsed && !isEditing && (
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(project, e)}
                      className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1 rounded hover:bg-background text-muted-foreground hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Status Rows & Settings */}
      <div className="border-t border-border p-2.5 space-y-2 shrink-0 bg-surface-1">
        {/* Status Rows */}
        <div className="space-y-1.5 text-xs">
          {/* Key Status */}
          <div
            onClick={() => onFixStatus('key')}
            className={`px-2 py-1 rounded-[6px] flex items-center justify-between cursor-pointer transition-colors ${
              collapsed ? 'justify-center' : ''
            } hover:bg-surface-2`}
            title={statusLights.keyConnected ? 'Key connected' : 'Click to configure key'}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  statusLights.keyConnected ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              {!collapsed && (
                <span className="text-muted-foreground text-[11px] truncate">
                  Key: {statusLights.keyConnected ? 'Connected' : 'Not configured'}
                </span>
              )}
            </div>
          </div>

          {/* Studio Status */}
          <div
            onClick={() => onFixStatus('studio')}
            className={`px-2 py-1 rounded-[6px] flex items-center justify-between cursor-pointer transition-colors ${
              collapsed ? 'justify-center' : ''
            } hover:bg-surface-2`}
            title={statusLights.studioConnected ? 'Studio bridge online' : 'Click to pair with Studio'}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  statusLights.studioConnected ? 'bg-emerald-400' : 'bg-muted-foreground/40'
                }`}
              />
              {!collapsed && (
                <span className="text-muted-foreground text-[11px] truncate">
                  Studio: {statusLights.studioConnected ? 'Paired (4243)' : 'Not paired'}
                </span>
              )}
            </div>
          </div>

          {/* Vault Status */}
          <div
            onClick={() => onFixStatus('vault')}
            className={`px-2 py-1 rounded-[6px] flex items-center justify-between cursor-pointer transition-colors ${
              collapsed ? 'justify-center' : ''
            } hover:bg-surface-2`}
            title={statusLights.vaultLoaded ? 'Vault loaded' : 'Click to verify vault path'}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  statusLights.vaultLoaded ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              {!collapsed && (
                <span className="text-muted-foreground text-[11px] truncate">
                  Vault: {statusLights.vaultLoaded ? '1,333 notes' : 'Missing path'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-[8px] hover:bg-surface-2 text-muted-foreground hover:text-foreground text-xs transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};
