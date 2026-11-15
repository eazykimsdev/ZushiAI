# ZushiAI Redesign & Engineering Progress

## Project Vision & Context
ZushiAI is an AI Roblox game builder desktop application (BYOK, Studio bridge, built-in LihFolk vault) designed in the calm, spacious style of Claude's app, themed after Admiral Fujitora's violet gravity fruit motif (*Zushi Zushi no Mi*).

---

## Task Execution Status

### Task 0: Fix API Key + Model Bug ✅ COMPLETED
- **Root Cause Resolved**: Hardcoded model ID (`anthropic/claude-3.7-sonnet`) was retired on OpenRouter, resulting in 404 "model no longer available" while erroneously reporting API key failures.
- **Dynamic Live Models**:
  - Implemented `fetch_provider_models` in Rust backend (`src-tauri/src/ai_test.rs` and `commands.rs`) and TypeScript `fetchLiveModels` (`src/lib/api.ts`).
  - OpenRouter live query (`GET https://openrouter.ai/api/v1/models`) and Gemini live query (`GET https://generativelanguage.googleapis.com/v1beta/models`).
  - Searchable live model dropdown with real-time filtering, context length display, pricing, and recommended badges in `SettingsTab.tsx`.
  - App remembers and persists the last working model per provider across sessions.
- **Real 1-Token Test Verification**:
  - `test_provider_key` now performs an authentic 1-token completion check against the selected model before declaring connection.
  - Four explicit connection states supported: `not_set`, `checking`, `connected`, `failed with reason`.
- **Accurate Error Mapping**:
  - `401`: "Key rejected by <provider>. Please verify your API key."
  - `402`: "Insufficient credits on <provider>. Please add funds."
  - `404`: "This model is no longer available. Pick another." (with suggested replacement)
  - `429`: "Rate limit reached. Please retry shortly."
  - Offline/Network: "Network error or provider unreachable."
  - Raw provider responses are preserved in expandable `<details><summary>Details</summary></details>`.
- **404 Model Recovery UX**:
  - When a model 404 occurs during an agent run, ZushiAI suggests an available alternative model and prompts for user confirmation before retrying once. Never switches silently.

---

### Task 1: Remove Everything Fake ✅ COMPLETED
- **Seeded Project Removed**: Eliminated the hardcoded "Aether Blades: Arena Legends" seed logic and added automatic purge of leftover seed entries from SQLite. First launch presents an honest, clean empty state.
- **Removed Fake Block Palette**: Completely deleted the artificial macro block list with fake colored category badges (`SERVER`, `COMBAT`, etc.). Replaced sidebar with a real SQLite build manager (search, rename, delete).
- **Accurate Real Statistics**:
  - Replaced misleading `"100% success rate"` placeholder on 0 runs with `"-"`.
  - Total runs displays `"-"` when no executions have occurred.
  - Real token and dollar spend tracked directly from provider usage metadata.
- **Unbuilt Tabs Eliminated**: Removed unfinished tabs (`DashboardTab`, `AssetsTab`, `FavoritesTab`). Kept strictly **Home** (`HomeTab.tsx`), **Build** (`BuilderTab.tsx`), **Projects** (collapsible SQLite sidebar), and **Settings** (`SettingsTab.tsx`).
- **100% Real Status Verification**:
  - Key: Verified via Keychain (`api.hasApiKey`) and 1-token test.
  - Studio Bridge: Live ping against `http://127.0.0.1:4243/ping` with timeout.
  - Vault: Live filesystem inspection via Rust command `check_vault_path` measuring 1,333 actual markdown notes on disk.
- **Helpful Empty States**: Zero lorem ipsum or fake "coming soon" placeholders; all empty states are actionable, human sentences.

---

### Task 2: Brand + Design System ✅ COMPLETED
- **ZushiAI Design Tokens**:
  - Dark Theme (Default): `#0E0B14` (background), `#15111F` (surface-1), `#1C1729` (surface-2), `rgba(255,255,255,0.08)` (border), `#EDE9F5` (foreground), `#9A93AD` (muted-foreground), `#6D4AE0` (primary violet), `#A78BFA` (accent text), `#5BD08A` (success), `#F0647A` (error), `#E5B25D` (warning).
  - Light Theme Toggle: `#F6F3EE` (background), `#FFFFFF` (surface), `#1F1B2E` (foreground), `#5B3FD1` (primary), with high-contrast semantic tokens.
  - Violet is the single brand color; green/red/amber are reserved strictly for true state indications.
- **Local Fontsource Typography (Zero CDN)**:
  - Serif headline font: `@fontsource/fraunces` for calm serif headlines ("What are we building?").
  - UI font: `@fontsource/inter` (14px base, 12-13px secondary) with sentence case throughout.
  - Code/Terminal/Numbers font: `@fontsource/jetbrains-mono`.
- **Canvas Gravity-Well Background**:
  - Created `GravityBackground.tsx`: HTML5 canvas rendering a top soft radial glow (`rgba(109, 74, 224, 0.12)`) and a subtle dot-grid curving gently toward the prompt center like a gravity well.
  - Capped strictly at 30fps. Automatically pauses on window blur/hidden and when `prefers-reduced-motion` is active. Toggleable in Settings.

---

### Task 3: Layout ⏳ PENDING
### Task 4: Components & Live Wiring ⏳ PENDING
### Task 5: One-Prompt Build Flow ⏳ PENDING
