import * as React from 'react';
import {
  PawPrint,
  Swords,
  Flag,
  Factory,
  ShoppingBag,
  ArrowUpRight,
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

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative select-none">
      {/* Hero */}
      <section className="relative pt-12 pb-14">
        <div className="relative max-w-[780px] mx-auto px-8 fade-up">
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="ZushiAI"
              className="h-12 w-12 object-contain mb-5"
              draggable={false}
            />
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

      {/* Pick up where you left off (recent builds) */}
      {recent.length > 0 && (
        <div className="max-w-[1040px] mx-auto px-8 pb-20">
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
        </div>
      )}
    </div>
  );
};
