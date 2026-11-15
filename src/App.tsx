import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, FixTarget } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { ProcessDrawer } from './components/layout/ProcessDrawer';
import { StudioPairingModal } from './components/layout/StudioPairingModal';
import { HomeTab } from './components/tabs/HomeTab';
import { BuilderTab } from './components/tabs/BuilderTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { GravityBackground } from './components/ui/GravityBackground';
import {
  AgentActionState,
  ChatMessage,
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

type SettingsFocus = 'profile' | 'key' | 'studio' | 'vault' | null;

/** Short readable build name from the first prompt. */
function deriveBuildName(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Untitled build';
  const firstSentence = clean.split(/[.!?\n]/)[0].trim();
  const words = firstSentence.split(' ').slice(0, 7).join(' ');
  const name = words.length > 44 ? words.slice(0, 44).trimEnd() + '…' : words;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [settingsFocus, setSettingsFocus] = useState<SettingsFocus>(null);
  const [pendingPrompt, setPendingPrompt] = useState<{ text: string; attachments?: any[] } | null>(null);
  const [isBuildPanelCollapsed, setIsBuildPanelCollapsed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<ChatMessage | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    activeProvider: 'openrouter',
    activeModel: '',
    monthlyBudgetLimit: 10.0,
    sessionBudgetLimit: 2.0,
    currentMonthSpend: 0.0,
    currentSessionSpend: 0.0,
    vaultPath: 'C:\\Users\\sulma\\.gemini\\antigravity\\scratch\\v2-vault\\LihFolk Vault V2',
    theme: 'dark',
    backgroundEffect: true,
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [statusLights, setStatusLights] = useState<StatusLights>({
    keyConnected: false,
    studioConnected: false,
    vaultLoaded: false,
  });

  const [actionState, setActionState] = useState<AgentActionState>({
    status: 'idle',
    currentAction: 'Idle',
    taskCurrent: 0,
    taskTotal: 6,
    lastRunTime: '',
    spentBudget: 0.0,
  });

  const [scoreboard, setScoreboard] = useState<Scoreboard>({
    totalRuns: 0,
    successfulRuns: 0,
    successRate: 0,
  });
  const [runHistory, setRunHistory] = useState<RunHistoryRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info', badge?: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      badge,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Theme class on <html> so portals, scrollbars and the canvas all follow it
  useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
  }, [settings.theme]);

  /** Real checks: keychain + 1-token request, Studio bridge ping, vault folder on disk. */
  const refreshStatus = useCallback(async (opts?: { verifyKey?: boolean }) => {
    const s = settingsRef.current;
    const [hasKey, studioOk, vaultRes] = await Promise.all([
      api.hasApiKey(s.activeProvider).catch(() => false),
      api.checkStudioConnection().catch(() => false),
      api.checkVaultPath(s.vaultPath).catch(() => ({ exists: false, noteCount: 0 })),
    ]);

    let keyOk = false;
    let keyDetail: string | undefined;
    if (!hasKey) {
      keyDetail = 'No key saved yet';
    } else if (!s.activeModel) {
      keyDetail = 'Key saved. Pick a model to verify it';
    } else if (opts?.verifyKey === false) {
      keyOk = true;
    } else {
      try {
        const res = await api.testApiKey(s.activeProvider, s.activeModel);
        keyOk = res.success;
        keyDetail = res.success ? 'Verified with a live request' : res.message;
        if (res.success) api.rememberLastWorkingModel(s.activeProvider, s.activeModel);
      } catch (err: any) {
        keyDetail = err?.humanMessage || err?.message || 'Key check failed';
      }
    }

    setStatusLights({
      keyConnected: keyOk,
      keyDetail,
      studioConnected: studioOk,
      vaultLoaded: vaultRes.exists && vaultRes.noteCount > 0,
      vaultNotes: vaultRes.noteCount,
    });
  }, []);

  // Initial load from SQLite
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loadedSettings = await api.getSettings();
        if (!mounted) return;
        setSettings(loadedSettings);
        settingsRef.current = loadedSettings;

        const loaded = await api.getProjects();
        if (mounted) setProjects(loaded);

        await refreshStatus();

        const history = await api.getRunHistory();
        if (mounted && history.length > 0) {
          setRunHistory(history);
          const successful = history.filter((h) => h.status === 'success').length;
          setScoreboard({
            totalRuns: history.length,
            successfulRuns: successful,
            successRate: Math.round((successful / history.length) * 100),
          });
          setActionState((prev) => ({ ...prev, spentBudget: history.reduce((a, h) => a + h.estimatedCost, 0) }));
        }
      } catch (err: any) {
        addLog(`Startup check: ${err?.message || err}`, 'warn');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addLog, refreshStatus]);

  const handleSaveApiKey = async (provider: ProviderId, key: string) => {
    await api.saveApiKey(provider, key);
    await refreshStatus({ verifyKey: false });
  };

  const handleRecordSpend = (cost: number) => {
    setActionState((prev) => ({
      ...prev,
      spentBudget: prev.spentBudget + cost,
      lastRunTime: new Date().toLocaleTimeString(),
    }));
    setScoreboard((prev) => {
      const total = prev.totalRuns + 1;
      const ok = prev.successfulRuns + 1;
      return { totalRuns: total, successfulRuns: ok, successRate: Math.round((ok / total) * 100) };
    });
  };

  const handleUpdateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settingsRef.current, ...partial };
    settingsRef.current = updated;
    setSettings(updated);
    for (const [k, v] of Object.entries(partial)) {
      await api.saveSetting(k, String(v ?? ''));
    }
    if (partial.activeProvider) {
      const hasKey = await api.hasApiKey(partial.activeProvider);
      setStatusLights((prev) => ({ ...prev, keyConnected: false, keyDetail: hasKey ? 'Key saved. Test it in Settings' : 'No key saved yet' }));
    }
  };

  const navigate = (tab: TabId, focus: SettingsFocus = null) => {
    setSettingsFocus(focus);
    setActiveTab(tab);
  };

  const handleFixStatus = (target: FixTarget) => {
    if (target === 'studio') setIsStudioModalOpen(true);
    else navigate('settings', target);
  };

  /** Creates a real SQLite project from the first prompt, then opens the build view and starts the run. */
  const handleLaunchBuild = async (prompt: string, attachments?: any[]) => {
    try {
      const created = await api.createProject(deriveBuildName(prompt), '', prompt.trim().slice(0, 600));
      setProjects((prev) => [created, ...prev]);
      setActiveProject(created);
      addLog(`Created build "${created.name}".`, 'success', 'SQLITE');
    } catch (err: any) {
      addLog(`Could not save the build: ${err?.message || err}`, 'error');
    }
    setPendingPrompt({ text: prompt, attachments });
    setActiveTab('build');
  };

  const handleRenameProject = async (id: string, newName: string) => {
    const current = projects.find((p) => p.id === id);
    if (!current) return;
    const updated = await api.updateProject(id, newName, current.genre, current.notes, current.styleReferenceImage);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (activeProject?.id === id) setActiveProject(updated);
  };

  const handleDeleteProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    await api.deleteProject(id);
    await api.deleteChat(id).catch(() => {});
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(null);
      setActiveTab('home');
    }
    addLog(`Deleted build "${target?.name || id}".`, 'warn');
  };

  const handleStopPrompt = () => {
    setActionState((prev) => ({ ...prev, status: 'stopped', currentAction: 'Stopped by you' }));
    addLog('Agent run stopped by user.', 'warn');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden relative bg-background text-foreground font-sans select-none">
      <GravityBackground enabled={settings.backgroundEffect !== false} />

      <Sidebar
        projects={projects}
        activeProject={activeProject}
        activeTab={activeTab}
        settings={settings}
        statusLights={statusLights}
        isRunning={isAgentRunning}
        onNavigate={(tab) => navigate(tab)}
        onSelectProject={(p) => {
          setActiveProject(p);
          setPendingPrompt(null);
          navigate('build');
        }}
        onNewBuild={() => {
          setActiveProject(null);
          navigate('home');
        }}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onFixStatus={handleFixStatus}
        onOpenProfile={() => navigate('settings', 'profile')}
        onToggleTheme={() => handleUpdateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
      />

      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {activeTab === 'home' && (
              <HomeTab
                statusLights={statusLights}
                settings={settings}
                projects={projects}
                onOpenProject={(p) => {
                  setActiveProject(p);
                  navigate('build');
                }}
                onFixStatus={handleFixStatus}
                onUpdateSettings={handleUpdateSettings}
                onLaunchBuild={handleLaunchBuild}
              />
            )}

            {activeTab === 'build' && activeProject && (
              <BuilderTab
                key={activeProject.id}
                activeProject={activeProject}
                settings={settings}
                actionState={actionState}
                initialPrompt={pendingPrompt}
                onClearInitialPrompt={() => setPendingPrompt(null)}
                onRunPrompt={() => {}}
                onStopPrompt={handleStopPrompt}
                onUpdateSettings={handleUpdateSettings}
                hasKey={statusLights.keyConnected}
                onSaveKey={handleSaveApiKey}
                onAddLog={addLog}
                onRecordSpend={handleRecordSpend}
                onRunningChange={setIsAgentRunning}
                onAssistantMessage={setLastAssistantMessage}
                onOpenSettings={(focus: SettingsFocus) => navigate('settings', focus)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onKeyStatusChange={() => refreshStatus({ verifyKey: false })}
                onAddLog={addLog}
                focusSection={settingsFocus}
              />
            )}
          </main>

          {activeTab === 'build' && activeProject && (
            <RightPanel
              actionState={actionState}
              statusLights={statusLights}
              scoreboard={scoreboard}
              runHistory={runHistory}
              activeMessage={lastAssistantMessage}
              collapsed={isBuildPanelCollapsed}
              onToggleCollapse={() => setIsBuildPanelCollapsed(!isBuildPanelCollapsed)}
              monthlyLimit={settings.monthlyBudgetLimit}
              onPairStudio={() => setIsStudioModalOpen(true)}
            />
          )}
        </div>

        <ProcessDrawer logs={logs} onClearLogs={() => setLogs([])} onPopOutLogs={() => {}} />
      </div>

      <StudioPairingModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        connected={statusLights.studioConnected}
        onResult={(ok) => {
          setStatusLights((prev) => ({ ...prev, studioConnected: ok }));
          addLog(ok ? 'Studio bridge answered on 127.0.0.1:4243.' : 'Studio bridge did not answer on 127.0.0.1:4243.', ok ? 'success' : 'warn', 'STUDIO');
        }}
      />
    </div>
  );
};

export default App;
