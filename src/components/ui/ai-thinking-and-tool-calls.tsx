import * as React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  FileEdit,
  Search,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Copy,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// Types
// ==========================================

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed';
export type NodeType = 'reasoning' | 'tool' | 'terminal' | 'message';

export interface DiffRow {
  type: 'add' | 'del' | 'same';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface TraceNode {
  id: string;
  type: NodeType;
  status: NodeStatus;
  title: string;
  durationMs?: number;
  // Reasoning
  sentences?: string[];
  // Tool
  toolName?: string;
  toolCategory?: string;
  args?: Record<string, any>;
  sources?: string[]; // for search tool
  code?: string; // for read tool or code
  language?: string;
  diffRows?: DiffRow[]; // for edit_file
  addCount?: number;
  delCount?: number;
  details?: string; // for quality_score
  // Terminal
  command?: string;
  output?: string;
  exitCode?: number;
}

export interface ToolDefinition {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

// Built-in registry with icons including custom image_gen and quality_score
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  search: {
    name: 'search',
    label: 'Vault Knowledge Search',
    icon: Search,
    description: 'Searches LihFolk 1,300+ note engineering vault',
  },
  read: {
    name: 'read',
    label: 'Read Vault Note',
    icon: BookOpen,
    description: 'Reads vault rules, checklists, and symptom notes',
  },
  edit_file: {
    name: 'edit_file',
    label: 'Studio Script Edit',
    icon: FileEdit,
    description: 'Writes and modifies Luau source files in Studio',
  },
  image_gen: {
    name: 'image_gen',
    label: 'Image Generation',
    icon: ImageIcon,
    description: 'Generates UI texture or reference image',
  },
  quality_score: {
    name: 'quality_score',
    label: 'Quality Score Review',
    icon: Award,
    description: 'Scores system against LihFolk rubrics (minimum 8.5/10)',
  },
  terminal: {
    name: 'terminal',
    label: 'Terminal Command',
    icon: Terminal,
    description: 'Runs CLI commands and Luau type checker',
  },
};

// ==========================================
// CodeBlock Component
// ==========================================

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'luau',
  filename,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('rounded-lg border border-border bg-black/60 overflow-hidden text-xs my-2', className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-white/[0.03] text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5">
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span>{filename || language}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 font-mono text-[11px] text-zinc-200 overflow-x-auto scrollbar-thin select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ==========================================
// FileDiff Component
// ==========================================

export interface FileDiffProps {
  filename?: string;
  diffRows?: DiffRow[];
  addCount?: number;
  delCount?: number;
  className?: string;
}

export const FileDiff: React.FC<FileDiffProps> = ({
  filename = 'Script.luau',
  diffRows = [],
  addCount,
  delCount,
  className,
}) => {
  const calculatedAdds =
    addCount ?? diffRows.filter((r) => r.type === 'add').length;
  const calculatedDels =
    delCount ?? diffRows.filter((r) => r.type === 'del').length;

  return (
    <div className={cn('rounded-lg border border-border bg-black/70 overflow-hidden text-xs my-2', className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-white/[0.03] text-[11px] font-mono">
        <span className="flex items-center gap-1.5 text-foreground font-medium">
          <FileEdit className="h-3.5 w-3.5 text-primary" />
          <span>{filename}</span>
        </span>
        <div className="flex items-center gap-2">
          {calculatedAdds > 0 && (
            <span className="text-emerald-400 font-semibold">+{calculatedAdds}</span>
          )}
          {calculatedDels > 0 && (
            <span className="text-rose-400 font-semibold">-{calculatedDels}</span>
          )}
        </div>
      </div>
      <div className="font-mono text-[11px] overflow-x-auto scrollbar-thin select-text divide-y divide-white/[0.03]">
        {diffRows.map((row, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-start px-2 py-0.5 leading-relaxed font-mono',
              row.type === 'add' && 'bg-emerald-500/10 text-emerald-300',
              row.type === 'del' && 'bg-rose-500/10 text-rose-300',
              row.type === 'same' && 'text-zinc-400'
            )}
          >
            <span className="w-8 shrink-0 text-right pr-2 text-zinc-600 select-none text-[10px]">
              {row.oldLineNumber || ''}
            </span>
            <span className="w-8 shrink-0 text-right pr-2 text-zinc-600 select-none text-[10px]">
              {row.newLineNumber || ''}
            </span>
            <span className="w-4 shrink-0 text-center select-none font-bold">
              {row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' '}
            </span>
            <span className="flex-1 whitespace-pre">{row.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// TerminalCommand Component
// ==========================================

export interface TerminalCommandProps {
  command: string;
  output?: string;
  exitCode?: number;
  className?: string;
}

export const TerminalCommand: React.FC<TerminalCommandProps> = ({
  command,
  output,
  exitCode = 0,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isFailed = exitCode !== 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${command}\n${output || ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-black/80 overflow-hidden text-xs my-2 font-mono transition-colors',
        isFailed ? 'border-destructive/60' : 'border-border',
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-white/[0.03] text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-zinc-300 truncate">
            <span className="text-zinc-500 mr-1">$</span>
            {command}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isFailed ? (
            <span className="px-1.5 py-0.2 rounded bg-destructive/20 text-destructive text-[10px] font-semibold border border-destructive/40">
              exit {exitCode}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-semibold">exit 0</span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/10"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {output && (
        <pre className={cn(
          'p-3 text-[11px] overflow-x-auto max-h-48 scrollbar-thin select-text whitespace-pre-wrap leading-relaxed',
          isFailed ? 'text-rose-300' : 'text-zinc-300'
        )}>
          {output}
        </pre>
      )}
    </div>
  );
};

// ==========================================
// StreamingText Component
// ==========================================

export interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming = false,
  className,
}) => {
  return (
    <span className={cn('inline', className)}>
      {text}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
};

// ==========================================
// Markdown Component
// ==========================================

export interface MarkdownProps {
  content: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  // Simple, robust Markdown parser that renders formatting, code blocks, lists, and headers
  const parts = React.useMemo(() => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        elements.push(
          <div key={`text-${lastIndex}`} className="space-y-2 whitespace-pre-wrap leading-relaxed">
            {renderFormattedText(textBefore)}
          </div>
        );
      }

      const lang = match[1] || 'luau';
      const code = match[2].trim();
      elements.push(
        <CodeBlock key={`code-${match.index}`} code={code} language={lang} />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      elements.push(
        <div key={`text-${lastIndex}`} className="space-y-2 whitespace-pre-wrap leading-relaxed">
          {renderFormattedText(content.substring(lastIndex))}
        </div>
      );
    }

    return elements;
  }, [content]);

  return <div className={cn('text-xs text-foreground font-sans', className)}>{parts}</div>;
};

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-2 my-0.5">
          <span className="text-primary mt-1 text-[8px]">•</span>
          <span>{parseInlineFormatting(line.substring(2))}</span>
        </div>
      );
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-2 my-0.5">
          <span className="text-muted-foreground font-mono text-[11px] shrink-0">
            {numMatch[1]}.
          </span>
          <span>{parseInlineFormatting(numMatch[2])}</span>
        </div>
      );
    }
    // Headings
    if (line.startsWith('### ')) {
      return (
        <h4 key={lineIdx} className="font-semibold text-foreground text-xs mt-3 mb-1">
          {parseInlineFormatting(line.substring(4))}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={lineIdx} className="font-semibold text-foreground text-sm mt-3 mb-1">
          {parseInlineFormatting(line.substring(3))}
        </h3>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={lineIdx} className="h-1" />;
    }

    return <p key={lineIdx} className="my-0.5">{parseInlineFormatting(line)}</p>;
  });
}

function parseInlineFormatting(str: string): React.ReactNode {
  // Bold: **text**
  // Code: `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = str.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-mono text-[11px] border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ==========================================
// ThinkingState Component (Live Mode + Demo)
// ==========================================

export interface ThinkingStateProps {
  nodes?: TraceNode[];
  isLive?: boolean;
  status?: NodeStatus;
  summaryText?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const ThinkingState: React.FC<ThinkingStateProps> = ({
  nodes = [],
  isLive: _isLive = true,
  status = 'completed',
  summaryText,
  defaultExpanded,
  className,
}) => {
  const isRunning = status === 'running';
  const hasFailed = status === 'failed' || nodes.some((n) => n.status === 'failed');

  // Start expanded while running, collapse when done unless clicked
  const [isExpanded, setIsExpanded] = React.useState<boolean>(
    defaultExpanded ?? isRunning
  );
  const [expandedNodeId, setExpandedNodeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isRunning) {
      setIsExpanded(true);
    } else if (status === 'completed' && defaultExpanded === undefined) {
      // Auto-collapse when done
      setIsExpanded(false);
    }
  }, [isRunning, status, defaultExpanded]);

  // Compute summary stats
  const computedSummary = React.useMemo(() => {
    if (summaryText) return summaryText;
    const commandCount = nodes.filter((n) => n.type === 'terminal').length;
    const editCount = nodes.filter((n) => n.type === 'tool' && n.toolName === 'edit_file').length;
    const searchCount = nodes.filter((n) => n.type === 'tool' && n.toolName === 'search').length;
    const parts: string[] = [];

    if (commandCount > 0) {
      parts.push(`ran ${commandCount} command${commandCount > 1 ? 's' : ''}`);
    }
    if (editCount > 0) {
      parts.push(`edited ${editCount} file${editCount > 1 ? 's' : ''}`);
    }
    if (searchCount > 0) {
      parts.push(`searched ${searchCount} vault note${searchCount > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return `executed ${nodes.length} agent action${nodes.length !== 1 ? 's' : ''}`;
    }

    return parts.join(' · ');
  }, [nodes, summaryText]);

  const toggleNode = (id: string) => {
    setExpandedNodeId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card/60 overflow-hidden text-xs my-2 transition-all',
        isRunning && 'border-primary/40 ring-1 ring-primary/20',
        hasFailed && 'border-destructive/40',
        className
      )}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors select-none text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isRunning ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-medium text-foreground tracking-tight animate-pulse">
                Thinking & executing...
              </span>
            </div>
          ) : hasFailed ? (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="font-medium text-destructive">Action failed</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-[11px] truncate">
                {computedSummary}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-medium text-foreground text-xs">Completed</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-[11px] truncate">
                {computedSummary}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-muted-foreground">
            {nodes.length} step{nodes.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-140',
              isExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </button>

      {/* Expanded Accordion list */}
      {isExpanded && (
        <div className="p-3 border-t border-border/50 divide-y divide-border/40 space-y-2">
          {nodes.length === 0 ? (
            <div className="py-2 text-center text-muted-foreground text-xs font-mono">
              Waiting for agent steps...
            </div>
          ) : (
            nodes.map((node) => {
              const isOpen = expandedNodeId === node.id || isRunning;
              const toolDef = node.toolName ? TOOL_REGISTRY[node.toolName] : null;
              const IconComponent = toolDef?.icon || (node.type === 'terminal' ? Terminal : Sparkles);
              const isNodeFailed = node.status === 'failed';

              return (
                <div key={node.id} className="pt-2 first:pt-0">
                  <div
                    onClick={() => toggleNode(node.id)}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                      isOpen ? 'bg-muted/40' : 'hover:bg-muted/20'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {node.status === 'running' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      ) : isNodeFailed ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      ) : node.status === 'completed' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}

                      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>

                      <span className={cn(
                        'text-xs truncate font-medium',
                        isNodeFailed ? 'text-destructive font-semibold' : 'text-foreground'
                      )}>
                        {node.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {node.durationMs && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {node.durationMs}ms
                        </span>
                      )}
                      {isNodeFailed && node.exitCode !== undefined && (
                        <span className="px-1.5 py-0.2 rounded bg-destructive/20 text-destructive text-[10px] font-bold border border-destructive/40 font-mono">
                          exit {node.exitCode}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground transition-transform duration-140',
                          isOpen ? 'rotate-90' : 'rotate-0'
                        )}
                      />
                    </div>
                  </div>

                  {/* Node details */}
                  {isOpen && (
                    <div className="mt-2 pl-6 pr-2 pb-1 space-y-2">
                      {/* Reasoning sentences */}
                      {node.sentences && node.sentences.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-border/50">
                          {node.sentences.map((s, idx) => (
                            <p key={idx}>{s}</p>
                          ))}
                        </div>
                      )}

                      {/* Search sources */}
                      {node.sources && node.sources.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-foreground">
                            Top Vault References:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {node.sources.map((src, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border text-[11px]"
                              >
                                <BookOpen className="h-3 w-3 text-primary" />
                                <span>{src}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Code / Read excerpt */}
                      {node.code && (
                        <CodeBlock
                          code={node.code}
                          language={node.language || 'luau'}
                          filename={node.title}
                        />
                      )}

                      {/* File Diff */}
                      {node.diffRows && node.diffRows.length > 0 && (
                        <FileDiff
                          filename={node.title}
                          diffRows={node.diffRows}
                          addCount={node.addCount}
                          delCount={node.delCount}
                        />
                      )}

                      {/* Quality Score Details */}
                      {node.details && (
                        <div className="p-2.5 rounded-lg bg-black/40 border border-border text-xs space-y-1">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-amber-400" />
                            <span>LihFolk Rubric Audit:</span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap font-mono text-[11px]">
                            {node.details}
                          </p>
                        </div>
                      )}

                      {/* Terminal Command */}
                      {node.type === 'terminal' && node.command && (
                        <TerminalCommand
                          command={node.command}
                          output={node.output}
                          exitCode={node.exitCode}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// AgentWorkflow Component
// ==========================================

export interface AgentWorkflowPhase {
  id: string;
  name: string;
  status: NodeStatus;
  nodes: TraceNode[];
  finalResponse?: string;
}

export interface AgentWorkflowProps {
  phases: AgentWorkflowPhase[];
  className?: string;
}

export const AgentWorkflow: React.FC<AgentWorkflowProps> = ({ phases, className }) => {
  return (
    <div className={cn('space-y-4 w-full', className)}>
      {phases.map((phase) => (
        <div key={phase.id} className="space-y-2">
          <ThinkingState
            nodes={phase.nodes}
            status={phase.status}
            summaryText={`Phase: ${phase.name}`}
          />
          {phase.finalResponse && (
            <div className="pl-2">
              <Markdown content={phase.finalResponse} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
