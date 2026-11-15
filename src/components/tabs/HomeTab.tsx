import * as React from 'react';
import {
  PawPrint,
  Swords,
  Flag,
  Factory,
  ShoppingBag,
  PencilLine,
  BookMarked,
  ShieldCheck,
  Rocket,
  ArrowUpRight,
  Sun,
  Moon,
  KeyRound,
  Clock,
} from 'lucide-react';
import { StatusLights, UserSettings, Project } from '../../types';
import { AttachmentComposerTray, AttachedFile } from '../ui/attachment-composer-tray';
import { ModelPicker } from '../ui/ModelPicker';
import { FixTarget } from '../layout/Sidebar';

interface HomeTabProps {
  statusLights: StatusLights;
  settings: UserSettings;
  projects: Project[];
  onOpenProject: (p: Project) => void;
  onFixStatus: (t: FixTarget) => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onLaunchBuild: (prompt: string, attachments?: AttachedFile[]) => void;
}

interface Starter {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

// Clean prompts without colon punctuation
const STARTERS: Starter[] = [
  {
    label: 'Pet simulator',
    icon: <PawPrint className="h-3.5 w-3.5" />,
    prompt:
      'Pet hatching simulator with three egg tiers, server-rolled rarities, luck boosts, an equip inventory and saved progress',
  },
  {
    label: 'Sword combat',
    icon: <Swords className="h-3.5 w-3.5" />,
    prompt:
      'Sword combat arena with server-validated hitboxes, light and heavy swings, combos, parry timing windows and hit-stop feedback',
  },
  {
    label: 'Obby',
    icon: <Flag className="h-3.5 w-3.5" />,
    prompt:
      'Obby with checkpoints that save per player, a stage counter, a speedrun timer and a finish leaderboard',
  },
  {
    label: 'Tycoon',
    icon: <Factory className="h-3.5 w-3.5" />,
    prompt:
      'Tycoon with droppers, conveyors, upgrade purchase pads, plot ownership and rebirth multipliers',
  },
  {
    label: 'Shop UI',
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
    prompt:
      'Responsive shop UI with tabs, game passes, developer products, working ProcessReceipt validation and purchase confirmation',
  },
];

const STEPS = [
  {
    icon: <PencilLine className="h-[18px] w-[18px]" />,
    title: 'Describe it',
    body: 'Write one prompt. Attach reference images, Luau scripts or notes if you have them.',
  },
  {
    icon: <BookMarked className="h-[18px] w-[18px]" />,
    title: 'Plan from the vault',
    body: 'ZushiAI queries the LihFolk vault for engineering rules on remotes, DataStores and UI.',
  },
  {
    icon: <ShieldCheck className="h-[18px] w-[18px]" />,
    title: 'Write and check',
    body: 'Luau scripts are generated with strict typing and verified before deployment.',
  },
  {
    icon: <Rocket className="h-[18px] w-[18px]" />,
    title: 'Push to Studio',
    body: 'Instances sync directly into your active Studio place over the localhost bridge.',
  },
];

function greeting(name?: string): string {
  const h = new Date().getHours();
  const part = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

const RINGS = [
  { size: 480, o: 0.8 },
  { size: 720, o: 0.5 },
  { size: 980, o: 0.3 },
  { size: 1280, o: 0.15 },
];

export const HomeTab: React.FC<HomeTabProps> = ({
  statusLights,
  settings,
  projects,
  onOpenProject,
  onFixStatus,
  onUpdateSettings,
  onLaunchBuild,
}) => {
  const [prompt, setPrompt] = React.useState('');
  const [notice, setNotice] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const focusComposer = (text?: string) => {
    if (typeof text === 'string') setPrompt(text);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const el = document.getElementById('home-composer') as HTMLTextAreaElement | null;
      el?.focus();
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }, 120);
  };

  const submit = (text: string, attachments: AttachedFile[]) => {
    if (!text.trim() && attachments.length === 0) return;
    if (!statusLights.keyConnected && !settings.activeModel) {
      setNotice('Add an API key first so there is a model to build with.');
      onFixStatus('key');
      return;
    }
    if (!settings.activeModel) {
      setNotice('Choose a model from the picker below the prompt.');
      return;
    }
    if (!statusLights.keyConnected) {
      setNotice(statusLights.keyDetail || 'Your API key is not verified yet. Open Settings to test it.');
      onFixStatus('key');
      return;
    }
    setNotice(null);
    onLaunchBuild(text, attachments);
    setPrompt('');
  };

  const recent = React.useMemo(
    () => [...projects].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 3),
    [projects]
  );

  const isLight = settings.theme === 'light';

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative select-none">
      {/* Top bar */}
      <div className="sticky top-0 z-20 h-14 px-8 flex items-center justify-between bg-background/40 backdrop-blur-md">
        <span className="text-[13px] text-white/60 font-medium tracking-wide">{greeting(settings.userName)}</span>
        <button
          type="button"
          onClick={() => onUpdateSettings({ theme: isLight ? 'dark' : 'light' })}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          className="h-9 w-9 flex items-center justify-center rounded-[10px] border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-colors cursor-pointer"
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[640px] overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute left-1/2 top-[320px]">
            {RINGS.map((r) => (
              <span
                key={r.size}
                className="gravity-ring"
                style={{ width: r.size, height: r.size, ['--ring-o' as any]: r.o, animationDelay: `${r.size / 400}s` }}
              />
            ))}
          </div>
        </div>

        <div className="relative max-w-[780px] mx-auto px-8 pt-8 pb-14 fade-up">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 group">
              <div className="absolute -inset-2 rounded-full bg-purple-500/20 blur-md group-hover:bg-purple-500/30 transition-all" />
              <img src="/logo.png" alt="" className="relative h-13 w-13 object-contain drop-shadow-[0_4px_16px_rgba(109,74,224,0.4)]" draggable={false} />
            </div>
            <h1 className="font-display text-[48px] sm:text-[60px] leading-[1.04] font-bold text-white tracking-tight">
              What are we <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-white bg-clip-text text-transparent">building</span>?
            </h1>
            <p className="mt-3.5 text-[15px] leading-relaxed text-white/70 max-w-[540px]">
              Describe a Roblox game. ZushiAI writes the Luau, checks it, and pushes it into Studio.
            </p>
          </div>

          <div className="mt-8">
            <div className="rounded-[16px] border border-white/[0.12] bg-[#120D1F]/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(109,74,224,0.12)] hover:border-purple-400/40 transition-all p-1.5">
              <AttachmentComposerTray
                value={prompt}
                onChange={(v) => {
                  setPrompt(v);
                  if (notice) setNotice(null);
                }}
                onSubmit={submit}
                textareaId="home-composer"
                minRows={3}
                submitLabel="Build it"
                placeholder="A pet simulator with three egg tiers, luck boosts and saved progress…"
                leftToolbar={
                  <ModelPicker
                    provider={settings.activeProvider}
                    hasKey={statusLights.keyConnected || statusLights.keyDetail?.startsWith('Key saved') === true}
                    value={settings.activeModel}
                    onChange={(id) => {
                      onUpdateSettings({ activeModel: id });
                      setNotice(null);
                    }}
                    onNeedKey={() => onFixStatus('key')}
                    placement="bottom"
                  />
                }
              />
            </div>

            <div className="mt-3 min-h-[20px] px-1" aria-live="polite">
              {notice ? (
                <div className="flex items-center gap-2 text-[13px] text-amber-300">
                  <KeyRound className="h-3.5 w-3.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              ) : (
                <span className="text-[12px] text-white/45">Enter to send · Shift + Enter for a new line</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => focusComposer(s.prompt)}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-purple-400/40 text-[13px] text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-sm group"
              >
                <span className="text-purple-300 group-hover:scale-110 transition-transform">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1040px] mx-auto px-8 pb-20 space-y-14">
        {/* Pick up where you left off */}
        {recent.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-[22px] font-bold text-white tracking-tight">Pick up where you left off</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recent.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenProject(p)}
                  className="group text-left rounded-[16px] border border-white/[0.08] bg-[#120D1F]/70 backdrop-blur-xl p-5 hover:border-purple-400/30 hover:bg-[#161026]/80 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-semibold text-white leading-snug line-clamp-2">{p.name}</div>
                    <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white shrink-0 transition-colors" />
                  </div>
                  {p.notes && <p className="mt-2 text-[12px] leading-relaxed text-white/60 line-clamp-2">{p.notes}</p>}
                  <div className="mt-3.5 flex items-center gap-1.5 text-[12px] text-white/40 font-mono">
                    <Clock className="h-3 w-3" />
                    {timeAgo(p.updatedAt || p.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* How a build works */}
        <section>
          <div className="mb-6">
            <h2 className="font-display text-[22px] font-bold text-white tracking-tight">How a build works</h2>
            <p className="mt-1 text-[13px] text-white/60">Four steps, all visible in the trace while they run.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-[16px] border border-white/[0.08] bg-[#120D1F]/70 backdrop-blur-xl p-5 hover:border-purple-400/30 hover:bg-[#161026]/80 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-[12px] bg-purple-500/15 border border-purple-400/20 text-purple-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    {s.icon}
                  </div>
                  <span className="font-mono text-[12px] text-white/40 font-medium">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
