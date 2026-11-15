# LihForge (AI Roblox Game Builder)

> **In the spirit of ForgeGUI**: Type what game or feature you want, and LihForge plans, writes Luau, generates art, checks quality against 1,300+ curated notes, and bridges it into Roblox Studio.

---

## 🔒 Security & BYOK Architecture
- **Bring Your Own Key (BYOK)**: Users provide their own AI API key (Google Gemini, Anthropic Claude, or OpenAI). You never pay for other users' tokens.
- **Hardware-Backed OS Keychain**: API keys are securely stored in the operating system's native keychain (**Windows Credential Manager** / macOS Keychain / Linux Secret Service).
  - ❌ Never stored in plain text files.
  - ❌ Never stored in browser `localStorage`.
  - ❌ Never transmitted to any third-party telemetry server.
- **Auto-Kill Budget Switch**: Configurable monthly and single-session budget caps automatically halt the agent if estimated token consumption reaches the user's limit.
- **Local-First & Auth Stub**: 100% local operation with SQLite. An isolated auth module stub is ready for future multi-seat or license key licensing without coupling to core builder logic.

---

## 📂 Project Architecture

```
lihforge/
├── src/                          # React + TypeScript Frontend
│   ├── auth/                     # Auth stub (clean separation for future accounts/licenses)
│   ├── components/
│   │   ├── layout/               # TopBar, Sidebar (Macro Palette), RightPanel, ProcessDrawer
│   │   ├── projects/             # Project modal & style reference uploader
│   │   └── tabs/                 # Dashboard, Builder, Assets, Favorites, Settings
│   ├── lib/                      # Tauri command invocations & state
│   ├── types/                    # Strongly typed domain models
│   ├── App.tsx                   # Main app shell & reactive orchestration
│   ├── index.css                 # Glassy, dark macro styling & badges
│   └── main.tsx
├── src-tauri/                    # Rust Tauri 2 Desktop Backend
│   ├── src/
│   │   ├── ai_test.rs            # Latency & validity probe for BYOK keys
│   │   ├── commands.rs           # Exposing SQLite & Keychain to frontend
│   │   ├── db.rs                 # SQLite connection, schema & CRUD (projects, history, settings)
│   │   ├── keychain.rs           # OS Credential Manager integration (keyring crate)
│   │   ├── lib.rs                # App setup & command registration
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── providers/                    # AI Provider interface & Model catalog
│   ├── index.ts
│   └── types.ts                  # Gemini, Claude, OpenAI definitions & token pricing
├── vault/                        # LihFolk Roblox Knowledge Vault integration stub
│   └── index.ts
└── studio-plugin/                # Roblox Studio Luau bridge protocol stub
    └── protocol.ts
```

---

## 🚀 Running LihForge

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Rust**: 1.80+ with MSVC or MinGW toolchain

### Development Mode (Frontend Web Preview)
```bash
npm install
npm run dev
```
Preview will run at `http://localhost:1420`.

### Desktop Mode (Tauri 2 Native App)
```bash
npm run tauri dev
```
or to build the standalone desktop binary:
```bash
npm run build
cd src-tauri
cargo build --release
```

---

## 🏁 Phase Status & Roadmap

### ✅ Phase 1: Shell + Keys (Complete)
- [x] Premium dark glassy app shell inspired by game-macro tools (near-black `#090a0f`, translucent blur panels, thin borders, colored badges `LIVE`, `SETUP`, `COMBAT`).
- [x] Top bar with project selector, style reference thumbnail pill, version badge, 5 tab icons, 3 live status indicators (`KEY`, `STUDIO`, `VAULT`), session timer, and spend readout.
- [x] Left sidebar with 20 categorized macro blocks (Core Systems, Gameplay & Combat, World & Map, Interface & HUD, Studio Ops).
- [x] Center workspace with tab router:
  - **Dashboard**: Project overview, system status cards, SQLite project manager.
  - **Builder**: Prompt chat input, multi-step pipeline preview (`PLAN` -> `EXECUTE` -> `CHECK` -> `SYNC`), model indicator.
  - **Assets**: Art studio preview.
  - **Favorites**: Macro snippet book.
  - **Settings**: Provider & model picker, OS keychain API key storage, live "Test Key" latency probe, monthly & session budget limits, vault folder selector.
- [x] Right status readout: current action, task progress $x/y$, last run timestamp, budget limit bar, session scoreboard (runs, success rate), Start / Pause / Stop controls, and run history.
- [x] Bottom process log drawer: live timestamped lines with level badges, clear button, and pop-out hook.
- [x] Project management in local SQLite (`lihforge.db`): create, edit, delete, and store 1 visual style reference image per project.
- [x] Dynamic AI provider interface: starting with Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`) with Claude and OpenAI interfaces ready.

### ⏳ Phase 2: Chat + Agent Loop (Next)
- Real-time agent streaming, step-by-step execution, checking and retries.

### ⏳ Phase 3: Knowledge Vault
- SQLite FTS5 / BM25 index over `LihFolk Vault V2` (1,300+ notes, TL;DR, checklists).

### ⏳ Phase 4: Roblox Studio Bridge
- Luau plugin with localhost pairing token and instance synchronization.

### ⏳ Phase 5: Code Checker
- 17 built-in Luau safety & anti-exploit rules.

### ⏳ Phase 6: Art Tools
- UI frame & icon generation matching style reference.

### ⏳ Phase 7: Quality + Game Doctor
- 8.5+ quality grading rubric & 1,000-player economy simulation.
