import * as React from 'react';
import {
  Home,
  Plus,
  Search,
  Settings,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Sun,
  Moon,
  UserRound,
  Key,
  Radio,
  BookMarked,
  Hammer,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, StatusLights, TabId, UserSettings } from '../../types';
import { Avatar } from '../ui/Avatar';

export type FixTarget = 'key' | 'studio' | 'vault';

interface SidebarProps {
  projects: Project[];
  activeProject: Project | null;
  activeTab: TabId;
  settings: UserSettings;
  statusLights: StatusLights;
  isRunning?: boolean;
  onNavigate: (tab: TabId) => void;
  onSelectProject: (project: Project) => void;
  onNewBuild: () => void;
  onRenameProject: (id: string, newName: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onFixStatus: (type: FixTarget) => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-5 pb-1.5 text-[12px] font-medium text-muted-foreground/80">{children}</div>
);

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  trailing?: React.ReactNode;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, collapsed, trailing, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={cn(
      'group w-full h-9 flex items-center gap-3 rounded-[10px] px-3 text-[13px] transition-all duration-150 cursor-pointer border',
      collapsed && 'justify-center px-0',
      active
        ? 'bg-white/[0.08] border-white/[0.14] text-white font-medium shadow-[0_2px_12px_rgba(109,74,224,0.18)]'
        : 'border-transparent text-white/70 hover:text-white hover:bg-white/[0.05]'
    )}
  >
    <span className={cn('shrink-0 transition-colors', active ? 'text-purple-300' : 'group-hover:text-white')}>
      {icon}
    </span>
    {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
    {!collapsed && trailing}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProject,
  activeTab,
  settings,
  statusLights,
  isRunning,
  onNavigate,
  onSelectProject,
  onNewBuild,
  onRenameProject,
  onDeleteProject,
  onFixStatus,
  onOpenProfile,
  onToggleTheme,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  // Ctrl/Cmd + K focuses search
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setStatusOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close popovers on outside click
  React.useEffect(() => {
    if (!statusOpen && !userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [statusOpen, userMenuOpen]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q) || (p.genre || '').toLowerCase().includes(q));
  }, [projects, query]);

  const recent = React.useMemo(
    () => [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 12),
    [filtered]
  );

  const commitRename = async (id: string) => {
    if (editName.trim()) await onRenameProject(id, editName.trim());
    setEditingId(null);
  };

  const checks: { id: FixTarget; label: string; ok: boolean; detail: string; icon: React.ReactNode; action: string }[] = [
    {
      id: 'key',
      label: 'API key',
      ok: statusLights.keyConnected,
      detail: statusLights.keyDetail || (statusLights.keyConnected ? 'Verified with a live request' : 'No key saved yet'),
      icon: <Key className="h-3.5 w-3.5" />,
      action: statusLights.keyConnected ? 'Manage' : 'Add key',
    },
    {
      id: 'studio',
      label: 'Roblox Studio',
      ok: statusLights.studioConnected,
      detail: statusLights.studioConnected ? 'Bridge answering on port 4243' : 'Bridge not reachable',
      icon: <Radio className="h-3.5 w-3.5" />,
      action: statusLights.studioConnected ? 'Details' : 'Connect',
    },
    {
      id: 'vault',
      label: 'LihFolk vault',
      ok: statusLights.vaultLoaded,
      detail: statusLights.vaultLoaded
        ? `${(statusLights.vaultNotes ?? 0).toLocaleString()} notes found`
        : 'Vault folder not found',
      icon: <BookMarked className="h-3.5 w-3.5" />,
      action: statusLights.vaultLoaded ? 'Change' : 'Choose folder',
    },
  ];
  const readyCount = checks.filter((c) => c.ok).length;

  const hasServer = Boolean(settings.serverName);
  const hasUser = Boolean(settings.userName);

  return (
    <aside
      className={cn(
        'relative z-20 h-full shrink-0 flex flex-col bg-[#0b0814]/70 backdrop-blur-2xl border-r border-white/[0.06] transition-[width] duration-200 select-none',
        collapsed ? 'w-[68px]' : 'w-[264px]'
      )}
    >
      {/* Roblox Experience / Project card */}
      <div className={cn('p-3', collapsed && 'px-2.5')}>
        <button
          type="button"
          onClick={onOpenProfile}
          title={hasServer ? settings.serverName : 'Set up Roblox Project'}
          className={cn(
            'w-full flex items-center gap-3 rounded-[12px] border border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer text-left',
            collapsed ? 'p-1.5 justify-center' : 'p-2.5'
          )}
        >
          {hasServer || settings.serverIcon ? (
            <Avatar src={settings.serverIcon} name={settings.serverName} size={40} rounded="xl" />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-[12px] border border-dashed border-white/15 flex items-center justify-center text-white/60 bg-white/[0.02]">
              <Plus className="h-4 w-4" />
            </div>
          )}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-white font-display leading-tight">
                  {hasServer ? settings.serverName : 'Roblox Experience'}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      readyCount === 3 ? 'bg-success' : readyCount === 0 ? 'bg-error' : 'bg-warning'
                    )}
                  />
                  <span className="truncate">
                    {hasServer
                      ? readyCount === 3
                        ? 'Ready to build'
                        : `${3 - readyCount} setup ${3 - readyCount === 1 ? 'step' : 'steps'} left`
                      : 'Roblox Studio Project'}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-white/40 shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-1">
          <div className="relative">
            <Search className="h-4 w-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search builds"
              className="w-full h-10 rounded-[10px] bg-white/[0.03] border border-white/[0.08] pl-9 pr-14 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400/60 focus:bg-white/[0.05] transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[11px] font-mono text-white/50 pointer-events-none">
              Ctrl K
            </kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 min-h-0 flex flex-col justify-between px-3 pb-3 overflow-hidden', collapsed && 'px-2.5 pt-2')}>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5">
          {!collapsed && <SectionLabel>Workspace</SectionLabel>}
          <div className="space-y-0.5">
            <NavButton
              icon={<Home className="h-[18px] w-[18px]" />}
              label="Home"
              active={activeTab === 'home'}
              collapsed={collapsed}
              onClick={() => onNavigate('home')}
            />
            <NavButton
              icon={<Plus className="h-[18px] w-[18px]" />}
              label="New build"
              collapsed={collapsed}
              onClick={onNewBuild}
            />
            {activeProject && (
              <NavButton
                icon={<Hammer className="h-[18px] w-[18px]" />}
                label="Current build"
                active={activeTab === 'build'}
                collapsed={collapsed}
                trailing={isRunning ? <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> : undefined}
                onClick={() => onNavigate('build')}
              />
            )}
          </div>

          {!collapsed && (
            <>
              <SectionLabel>Recent builds</SectionLabel>
              {recent.length === 0 ? (
                <p className="px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                  {query ? 'No builds match that search.' : 'Your builds will show up here once you start one.'}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {recent.map((p) => {
                    const active = activeProject?.id === p.id && activeTab === 'build';
                    if (editingId === p.id) {
                      return (
                        <form
                          key={p.id}
                          onSubmit={(e) => {
                            e.preventDefault();
                            commitRename(p.id);
                          }}
                          className="flex items-center gap-1 px-1"
                        >
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                            className="flex-1 min-w-0 h-8 rounded-[8px] bg-surface-1 border border-primary px-2 text-[13px] focus:outline-none"
                          />
                          <button type="submit" className="p-1.5 rounded-md text-success hover:bg-surface-1 cursor-pointer" aria-label="Save name">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-1 cursor-pointer" aria-label="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      );
                    }
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'group relative flex items-center rounded-[10px] border transition-colors duration-150',
                          active ? 'bg-surface-1 border-border-hover' : 'border-transparent hover:bg-surface-1/70'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectProject(p)}
                          className="flex-1 min-w-0 h-9 flex items-center gap-3 px-3 text-left cursor-pointer"
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', active ? 'bg-primary' : 'bg-muted-foreground/40')} />
                          <span className={cn('truncate text-[13px]', active ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground')}>
                            {p.name}
                          </span>
                        </button>
                        <div className="hidden group-hover:flex items-center pr-1.5 gap-0.5">
                          <button
                            type="button"
                            aria-label="Rename build"
                            title="Rename"
                            onClick={() => {
                              setEditingId(p.id);
                              setEditName(p.name);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete build"
                            title="Delete"
                            onClick={() => onDeleteProject(p.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-error hover:bg-surface-2 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* System & Settings pinned lower down */}
        <div className="pt-2 mt-auto border-t border-white/[0.06] shrink-0 space-y-0.5">
          {!collapsed && <SectionLabel>System</SectionLabel>}
          <NavButton
            icon={<Settings className="h-[18px] w-[18px]" />}
            label="Settings"
            active={activeTab === 'settings'}
            collapsed={collapsed}
            onClick={() => onNavigate('settings')}
          />
        </div>
      </nav>

      {/* Footer: status + user */}
      <div ref={popRef} className="relative border-t border-border p-3 space-y-2">
        {/* Status popover */}
        {statusOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-[12px] border border-border-hover bg-surface-1 p-1.5 fade-up z-30 w-[264px] max-w-[calc(100vw-24px)]">
            <div className="px-2.5 pt-2 pb-1.5 text-[12px] font-medium text-muted-foreground">System checks</div>
            {checks.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 hover:bg-surface-2 transition-colors">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2', c.ok ? 'text-success' : 'text-muted-foreground')}>
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-foreground leading-tight">{c.label}</div>
                  <div className={cn('text-[12px] truncate', c.ok ? 'text-muted-foreground' : 'text-warning')}>{c.detail}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatusOpen(false);
                    onFixStatus(c.id);
                  }}
                  className={cn(
                    'text-[12px] px-2.5 h-7 rounded-lg border transition-colors cursor-pointer',
                    c.ok
                      ? 'border-border text-muted-foreground hover:text-foreground hover:border-border-hover'
                      : 'border-primary/50 bg-primary-soft text-accent-text hover:bg-primary hover:text-primary-foreground'
                  )}
                >
                  {c.action}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* User menu popover */}
        {userMenuOpen && (
          <div className="absolute bottom-3 left-full ml-2 w-52 rounded-[12px] border border-border-hover bg-surface-1 p-1.5 fade-up z-30">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 h-9 text-[13px] text-foreground hover:bg-surface-2 cursor-pointer"
            >
              <UserRound className="h-4 w-4 text-muted-foreground" /> Edit profile
            </button>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                onToggleTheme();
              }}
              className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 h-9 text-[13px] text-foreground hover:bg-surface-2 cursor-pointer"
            >
              {settings.theme === 'light' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              {settings.theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            </button>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                onNavigate('settings');
              }}
              className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 h-9 text-[13px] text-foreground hover:bg-surface-2 cursor-pointer"
            >
              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setUserMenuOpen(false);
            setStatusOpen((v) => !v);
          }}
          title="System checks"
          className={cn(
            'w-full h-9 flex items-center gap-2.5 rounded-[10px] px-3 text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface-1/70 transition-colors cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
        >
          <Activity className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{readyCount === 3 ? 'All systems ready' : `${3 - readyCount} to fix`}</span>
              <span className="flex items-center gap-1">
                {checks.map((c) => (
                  <span key={c.id} className={cn('h-1.5 w-1.5 rounded-full', c.ok ? 'bg-success' : 'bg-muted-foreground/40')} />
                ))}
              </span>
            </>
          )}
        </button>

        <div className={cn('flex items-center gap-3', collapsed && 'flex-col gap-2')}>
          <button
            type="button"
            onClick={onOpenProfile}
            title={hasUser ? settings.userName : 'Set up Roblox Developer profile'}
            className={cn('flex items-center gap-3 min-w-0 flex-1 rounded-[10px] p-1.5 hover:bg-white/[0.05] transition-colors cursor-pointer text-left', collapsed && 'flex-none p-0')}
          >
            {hasUser || settings.userAvatar ? (
              <Avatar src={settings.userAvatar} name={settings.userName} size={36} />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/60 bg-purple-500/10">
                <UserRound className="h-4 w-4" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-white leading-tight">
                  {hasUser ? settings.userName : 'Roblox Developer'}
                </div>
                <div className="truncate text-[12px] text-white/50">
                  {settings.userHandle ? `@${settings.userHandle.replace(/^@/, '')}` : 'Developer Profile'}
                </div>
              </div>
            )}
          </button>
          {!collapsed && (
            <button
              type="button"
              aria-label="More"
              onClick={() => {
                setStatusOpen(false);
                setUserMenuOpen((v) => !v);
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors cursor-pointer"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
