import { ProviderId } from '../../providers/types';
import type { TraceNode } from '../components/ui/ai-thinking-and-tool-calls';
import type { AttachedFile } from '../components/ui/attachment-composer-tray';

export type TabId = 'home' | 'build' | 'settings';

export interface Project {
  id: string;
  name: string;
  genre: string;
  notes: string;
  styleReferenceImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  activeProvider: ProviderId;
  activeModel: string;
  monthlyBudgetLimit: number;
  sessionBudgetLimit: number;
  currentMonthSpend: number;
  currentSessionSpend: number;
  vaultPath: string;
  theme?: 'dark' | 'light';
  backgroundEffect?: boolean;
}

export interface StatusLights {
  keyConnected: boolean;
  studioConnected: boolean;
  vaultLoaded: boolean;
}

export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'checking'
  | 'fixing'
  | 'paused'
  | 'stopped'
  | 'error';

export interface AgentActionState {
  status: AgentStatus;
  currentAction: string;
  taskCurrent: number;
  taskTotal: number;
  lastRunTime: string;
  spentBudget: number;
}

export interface Scoreboard {
  totalRuns: number;
  successfulRuns: number;
  successRate: number;
}

export interface RunHistoryRecord {
  id: string;
  projectId?: string;
  timestamp: string;
  taskPrompt: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number;
  status: string;
  durationMs: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  message: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  traceNodes?: TraceNode[];
  isThinkingRunning?: boolean;
  isStreaming?: boolean;
  attachments?: AttachedFile[];
  planSteps?: {
    id: string;
    title: string;
    status: 'pending' | 'active' | 'done';
    detail: string;
  }[];
  codeSnippet?: {
    filename: string;
    targetLocation: string; // e.g. "ServerScriptService.DataService"
    code: string;
  };
  metrics?: {
    tokensInput: number;
    tokensOutput: number;
    cost: number;
    durationMs: number;
    model: string;
  };
  suggestions?: string[];
}

export interface AiChatResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number;
  durationMs: number;
  model: string;
  provider: string;
}
