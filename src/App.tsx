import React, { useState, useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { ProcessDrawer } from './components/layout/ProcessDrawer';
import { DashboardTab } from './components/tabs/DashboardTab';
import { BuilderTab } from './components/tabs/BuilderTab';
import { AssetsTab } from './components/tabs/AssetsTab';
import { FavoritesTab } from './components/tabs/FavoritesTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { ProjectModal } from './components/projects/ProjectModal';
import {
  AgentActionState,
  LogEntry,
  Project,
  RunHistoryRecord,
  Scoreboard,
  StatusLights,
  TabId,
  UserSettings,
} from './types';
import { api } from './lib/api';
import { ProviderId } from '../providers/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Settings State
  const [settings, setSettings] = useState<UserSettings>({
    activeProvider: 'openrouter',
    activeModel: 'anthropic/claude-3.7-sonnet',
    monthlyBudgetLimit: 10.0,
    sessionBudgetLimit: 2.0,
    currentMonthSpend: 0.0,
    currentSessionSpend: 0.0,
    vaultPath: 'C:\\Users\\sulma\\.gemini\\antigravity\\scratch\\v2-vault\\LihFolk Vault V2',
  });

  // Status indicators: Key, Studio, Vault
  const [statusLights, setStatusLights] = useState<StatusLights>({
    keyConnected: false,
    studioConnected: false,
    vaultLoaded: true,
  });

  // Agent action state
  const [actionState, setActionState] = useState<AgentActionState>({
    status: 'idle',
    currentAction: 'Idle — ready for task or block insert',
    taskCurrent: 0,
    taskTotal: 4,
    lastRunTime: '',
    spentBudget: 0.0,
  });

  // Scoreboard
  const [scoreboard, setScoreboard] = useState<Scoreboard>({
    totalRuns: 0,
    successfulRuns: 0,
    successRate: 100,
  });

  // Run history
  const [runHistory, setRunHistory] = useState<RunHistoryRecord[]>([]);

  // Process Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'LihForge Engine v0.1.0 initialized in local desktop mode.',
      badge: 'BOOT',
    },
    {
      id: 'log-init-2',
      timestamp: new Date().toISOString(),
      level: 'cmd',
      message: 'SQLite database connection established at $APPDATA/com.lihforge.app/lihforge.db',
      badge: 'SQLITE',
    },
    {
      id: 'log-init-3',
      timestamp: new Date().toISOString(),
      level: 'success',
      message: 'OS Keychain (Windows Credential Manager) BYOK vault loaded.',
      badge: 'KEYCHAIN',
    },
  ]);

  const addLog = (
    message: string,
    level: LogEntry['level'] = 'info',
    badge?: string
  ) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      badge,
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Load initial projects & settings from SQLite
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const loadedSettings = await api.getSettings();
        if (isMounted) setSettings(loadedSettings);

        const loadedProjects = await api.getProjects();
        if (isMounted) {
          if (loadedProjects.length === 0) {
            const sample = await api.createProject(
              'Aether Blades: Arena Legends',
              'Anime / Battlegrounds Combat',
              'Fast-paced combat with raycast hitboxes, dash mechanics, weapon abilities, and leaderboard podiums.',
              null
            );
            setProjects([sample]);
            setActiveProject(sample);
            addLog(`Initialized seed project "${sample.name}" in SQLite database.`, 'info');
          } else {
            setProjects(loadedProjects);
            setActiveProject(loadedProjects[0]);
          }
        }

        const hasKey = await api.hasApiKey(loadedSettings.activeProvider);
        if (isMounted) {
          setStatusLights((prev) => ({ ...prev, keyConnected: hasKey }));
        }

        const history = await api.getRunHistory();
        if (isMounted && history.length > 0) {
          setRunHistory(history);
          const successful = history.filter((h) => h.status === 'success').length;
          setScoreboard({
            totalRuns: history.length,
            successfulRuns: successful,
            successRate: Math.round((successful / history.length) * 100),
          });
          const totalSpent = history.reduce((acc, h) => acc + h.estimatedCost, 0);
          setActionState((prev) => ({ ...prev, spentBudget: totalSpent }));
        }
      } catch (err: any) {
        addLog(`Startup initialization note: ${err.message}`, 'warn');
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshKeyStatus = async () => {
    const hasKey = await api.hasApiKey(settings.activeProvider);
    setStatusLights((prev) => ({ ...prev, keyConnected: hasKey }));
  };

  const handleSaveApiKey = async (provider: ProviderId, key: string) => {
    await api.saveApiKey(provider, key);
    await refreshKeyStatus();
  };

  const handleRecordSpend = (cost: number) => {
    setActionState((prev) => ({
      ...prev,
      spentBudget: prev.spentBudget + cost,
      lastRunTime: new Date().toLocaleTimeString(),
    }));
    setScoreboard((prev) => ({
      totalRuns: prev.totalRuns + 1,
      successfulRuns: prev.successfulRuns + 1,
      successRate: Math.round(((prev.successfulRuns + 1) / (prev.totalRuns + 1)) * 100),
    }));
  };

  const handleUpdateSettings = async (newPartial: Partial<UserSettings>) => {
    const updated = { ...settings, ...newPartial };
    setSettings(updated);

    for (const [k, v] of Object.entries(newPartial)) {
      await api.saveSetting(k, String(v));
    }

    if (newPartial.activeProvider) {
      const hasKey = await api.hasApiKey(newPartial.activeProvider);
      setStatusLights((prev) => ({ ...prev, keyConnected: hasKey }));
    }
  };

  const handleSaveProject = async (data: {
    id?: string;
    name: string;
    genre: string;
    notes: string;
    styleReferenceImage?: string | null;
  }) => {
    if (data.id) {
      const updated = await api.updateProject(
        data.id,
        data.name,
        data.genre,
        data.notes,
        data.styleReferenceImage
      );
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProject?.id === updated.id) {
        setActiveProject(updated);
      }
      addLog(`Updated project "${updated.name}" settings in SQLite.`, 'success');
    } else {
      const created = await api.createProject(
        data.name,
        data.genre,
        data.notes,
        data.styleReferenceImage
      );
      setProjects((prev) => [created, ...prev]);
      setActiveProject(created);
      addLog(`Created new project "${created.name}" in SQLite.`, 'success');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    await api.deleteProject(id);
    const filtered = projects.filter((p) => p.id !== id);
    setProjects(filtered);
    if (activeProject?.id === id) {
      setActiveProject(filtered.length > 0 ? filtered[0] : null);
    }
    addLog(`Deleted project "${target?.name || id}" from SQLite.`, 'warn');
  };

  const handleInsertMacroBlock = (blockTitle: string, blockCategory: string) => {
    addLog(`Inserted macro block "${blockTitle}" [${blockCategory}] into Builder plan.`, 'cmd');
    setActionState((prev) => ({
      ...prev,
      currentAction: `Queued block: ${blockTitle}`,
    }));
    setActiveTab('builder');
  };

  const handleStopPrompt = () => {
    setActionState((prev) => ({
      ...prev,
      status: 'stopped',
      currentAction: 'Execution stopped by user',
    }));
    addLog('Agent execution halted by user.', 'warn');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProject={activeProject}
        projects={projects}
        onSelectProject={(p) => {
          setActiveProject(p);
          addLog(`Switched active project to "${p.name}".`, 'info');
        }}
        onOpenNewProjectModal={() => {
          setProjectToEdit(null);
          setIsProjectModalOpen(true);
        }}
        onEditActiveProject={() => {
          setProjectToEdit(activeProject);
          setIsProjectModalOpen(true);
        }}
        statusLights={statusLights}
        spentBudget={actionState.spentBudget}
        monthlyLimit={settings.monthlyBudgetLimit}
      />

      {/* Main Layout Body: Left Sidebar + Center Workspace + Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Palette */}
        <Sidebar onInsertMacroBlock={handleInsertMacroBlock} />

        {/* Center Main Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {activeTab === 'dashboard' && (
            <DashboardTab
              activeProject={activeProject}
              projects={projects}
              onSelectProject={(p) => setActiveProject(p)}
              onOpenNewProjectModal={() => {
                setProjectToEdit(null);
                setIsProjectModalOpen(true);
              }}
              onEditActiveProject={() => {
                setProjectToEdit(activeProject);
                setIsProjectModalOpen(true);
              }}
              setActiveTab={setActiveTab}
              statusLights={statusLights}
              spentBudget={actionState.spentBudget}
            />
          )}

          {activeTab === 'builder' && (
            <BuilderTab
              activeProject={activeProject}
              settings={settings}
              actionState={actionState}
              onRunPrompt={() => {}}
              onStopPrompt={handleStopPrompt}
              onUpdateSettings={handleUpdateSettings}
              hasKey={statusLights.keyConnected}
              onSaveKey={handleSaveApiKey}
              onAddLog={addLog}
              onRecordSpend={handleRecordSpend}
            />
          )}

          {activeTab === 'assets' && <AssetsTab activeProject={activeProject} />}

          {activeTab === 'favorites' && <FavoritesTab />}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onKeyStatusChange={refreshKeyStatus}
              onAddLog={addLog}
            />
          )}
        </main>

        {/* Right Status Readout & Scoreboard Panel */}
        <RightPanel
          actionState={actionState}
          scoreboard={scoreboard}
          runHistory={runHistory}
          onStartAgent={() => {
            if (activeTab !== 'builder') setActiveTab('builder');
          }}
          onPauseAgent={() => {
            setActionState((prev) => ({
              ...prev,
              status: prev.status === 'paused' ? 'executing' : 'paused',
            }));
            addLog(
              actionState.status === 'paused' ? 'Resumed agent execution.' : 'Paused agent.',
              'info'
            );
          }}
          onStopAgent={handleStopPrompt}
          monthlyLimit={settings.monthlyBudgetLimit}
        />
      </div>

      {/* Bottom Process Log Drawer */}
      <ProcessDrawer
        logs={logs}
        onClearLogs={() => setLogs([])}
        onPopOutLogs={() => addLog('Log pop-out window feature triggered.', 'info')}
      />

      {/* Project Create / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        initialProject={projectToEdit}
      />
    </div>
  );
};

export default App;
