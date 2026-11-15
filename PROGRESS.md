# LihForge Builder & UI Design Overhaul Progress

## Overview
LihForge was overhauled from a "vibe coded" prototype into a production-grade AI Roblox game engineering desktop application. The work was divided into two phases:
- **Phase A**: Component integration (`ai-thinking-and-tool-calls` and `attachment-composer-tray`) wired to real agent execution events and file dialogs.
- **Phase B**: Systematic visual polish adhering to strict non-AI aesthetic rules (neutral near-black palette, 3 surface levels, single blue accent, 10px radius, 140ms motion, WCAG AA contrast).

---

## Phase A: Component Integration & Live Agent Event Loop

### 1. Attachment Composer Tray (`src/components/ui/attachment-composer-tray.tsx`)
- **Implemented Primitives**:
  - `Attachment`, `AttachmentGroup`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentAction`, `AttachmentActions` in `src/components/ui/attachment.tsx`.
  - `Field`, `FieldLabel` in `src/components/ui/field.tsx`.
  - `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupTextarea` in `src/components/ui/input-group.tsx`.
- **Functionality**:
  - Auto-growing text area up to 160px with `Enter` (submit) and `Shift+Enter` (newline).
  - Horizontal scroll attachment tray with removable chips.
  - Native file picker via `@tauri-apps/plugin-dialog` (`.luau`, `.lua`, `.md`, `.txt`, `.png`, `.jpg`, `.webp`, `.json`) with automatic browser `<input type="file">` fallback.
  - Attachment limit cap (default 5); paperclip disables when reached.
  - Interactive state: Send button transforms into an active Stop button with cancel capabilities when agent is executing.

### 2. AI Thinking and Tool Calls (`src/components/ui/ai-thinking-and-tool-calls.tsx`)
- **Implemented Components**:
  - `ThinkingState`: Live mode (no autoPlay fake timers). Takes a growing `nodes` array. Shows active shimmering indicator while running and automatically settles to a collapsed action summary (`ran 2 commands · edited 1 file · searched 1 vault note`) upon completion.
  - `Markdown`: Native parser rendering bold, italics, lists, blockquotes, headings, and code blocks.
  - `CodeBlock`: Monospace Luau block with copy button and language tag.
  - `FileDiff`: Real line-by-line diff viewer showing added lines in emerald green (`+`), deleted lines in rose red (`-`), and neutral context rows.
  - `TerminalCommand`: Terminal execution window with command string, execution status, exit code badge (red when non-zero), and scrollable output log.
  - `StreamingText`: Real-time text stream animator with blinking cursor.
  - `AgentWorkflow`: Multi-phase execution container.

### 3. Agent Event Adapter (`src/lib/agentEvents.ts`)
- **Event-to-Node Mapping**:
  - **Reasoning**: Type `"reasoning"` with sentence breakdowns of architectural planning.
  - **Vault Search**: Type `"tool"`, `toolName: "search"`, listing top 3 note titles from LihFolk Vault.
  - **Vault Note Reading**: Type `"tool"`, `toolName: "read"`, displaying relevant code excerpts and rules.
  - **Studio Script Edit**: Type `"tool"`, `toolName: "edit_file"`, computing real line-by-line diffs with addition/deletion counts.
  - **Luau Type Checker**: Type `"terminal"`, running `lihforge check <file>` with findings and exit code (0 or 1).
  - **Quality Score**: Type `"tool"`, `toolName: "quality_score"`, evaluating against LihFolk rubrics (scoring out of 10.0 with 8.5 threshold).
  - **Error handling**: Failed steps render in red with specific exit codes.

---

## Phase B: Visual Polish & Systematic Hierarchy

### Before vs. After UI State Descriptions

| Surface | Before (Vibe-Coded) | After (Production Polished) |
| :--- | :--- | :--- |
| **Color Palette** | Dark purple/indigo background tint (`#090a0f`, `#0f1118`, `#111320`), purple gradient accents, glowing box-shadows. | Neutral zinc near-black (`#09090b`), 3 surface levels (Base `#09090b`, Card `#121215`, Elevated `#18181c`), 1px borders at ~8% white (`rgba(255,255,255,0.08)`). Zero purple tint. |
| **Accent Colors** | Multiple competing gradients (`from-indigo-600 via-purple-600 to-fuchsia-500`, cyan highlights). | ONE clean primary accent (`#3b82f6` blue) reserved strictly for primary buttons, focus rings, and active tabs. Status colors (green/red/amber) reserved solely for true state dots. |
| **Dashboard** | 3 huge interactive cards competing with hero, multiple buttons, large glowing indicators. | Clean hierarchy: ONE hero project card with a single primary button ("Launch AI Builder"), followed by a single compact status row (`Key` / `Studio` / `Vault` as small dots with text), then the project grid. |
| **Top Navigation** | Pill gradient backgrounds, heavy glow badges (`KEY`, `STUDIO`, `VAULT`), gradient brand badge. | Calmer top bar: active tab indicated by a subtle bottom underline (`border-b-2 border-primary`), session timer and budget spend displayed as plain text. |
| **Left Block Palette** | Colored pill badges (`SETUP`, `COMBAT`, `SERVER`, `SECURITY`), static list without accordion folding. | Collapsible categories with smooth 140ms chevrons, search bar on top, clean rows (`icon + title + one-line description`). Zero colored pill clutter. |
| **Status Readout (Right Panel)** | Heavy glowing pills (`IDLE / READY`, `LIVE: EXECUTING`), rainbow buttons. | Subtle dot indicator + plain text (`Ready`, `Working`, `Paused`, `Error`), clean 10px radius buttons. |
| **Typography & Spacing** | Monospace text overused for labels, uppercase headers everywhere, uneven border radii. | Inter font for UI (14px base, 12-13px secondary), sentence-case labels, monospace font ONLY for code, logs, and numbers. Strict 4/8px spacing and 10px border radius. |
| **Motion & Accessibility** | Unbounded bouncy animations (`animate-bounce`, heavy spinners). | 140ms transitions, row hover states, keyboard focus ring (`focus-visible:ring-2`), full `prefers-reduced-motion` compliance. |

---

## Verifications & Test Results
- **TypeScript & Vite Build**: Passed cleanly (`npm run build` in 742ms with 0 errors).
- **Desktop Release Binary**: Built and verified standalone at `lihforge.exe` (14.6 MB).
- **Localhost Web Parity**: Fully functional on `http://localhost:1420` with persistent local storage and in-browser AI tool execution.

## Limitations & External Notes
- None. All requested components, adapters, event mappings, and visual polish rules were implemented without altering database or agent backend logic.
