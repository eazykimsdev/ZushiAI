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

### Task 1: Remove Everything Fake ⏳ PENDING
### Task 2: Brand + Design System ⏳ PENDING
### Task 3: Layout ⏳ PENDING
### Task 4: Components & Live Wiring ⏳ PENDING
### Task 5: One-Prompt Build Flow ⏳ PENDING
