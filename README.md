# ZushiAI (AI Roblox Game Builder)

> **In the spirit of Admiral Fujitora's *Zushi Zushi no Mi* (Gravity Fruit)**: Calm, heavy, and purposeful — describe a Roblox game in plain words, and ZushiAI pulls everything together: plans the architecture, writes production Luau, verifies against 1,333 curated LihFolk vault notes, and pushes it directly to Roblox Studio.

---

## 🎨 Theme & Aesthetic
- **Calm, Spacious & Chat-First**: Modeled with the visual tranquility and restraint of Claude's desktop app.
- **Minimal Chrome & Serif Headlines**: Headlines rendered in bundled Fraunces serif; clean 14px Inter UI typography; monospace code restricted strictly to scripts and terminals.
- **Gravity-Well Canvas**: Subtle 30fps canvas background with a gentle violet glow (`#6D4AE0`) and a dot grid that bends subtly toward the prompt center.
- **Logo & Icons**: The violet gravity fruit emblem is located at `src/assets/logo.png` and `src/assets/logo.svg`.
  - To regenerate native Windows `.ico`, `.icns`, and multi-resolution PNG icons at any time, run:
    ```bash
    npx tauri icon src/assets/logo.png
    ```

---

## 🔒 Security & BYOK Architecture
- **Bring Your Own Key (BYOK)**: Users provide their own AI API key (Google Gemini direct or OpenRouter). You pay only your AI provider directly.
- **Dynamic Live Models**: Never hardcodes retired model IDs. Automatically queries live provider model lists and supports searchable model selection.
- **Real 1-Token Test Verification**: Verifies both key and model availability with an authentic 1-token request before declaring connection.
- **Hardware-Backed OS Keychain**: API keys are securely stored in the operating system's native keychain (**Windows Credential Manager** / macOS Keychain / Linux Secret Service).
  - ❌ Never stored in plain text files.
  - ❌ Never stored in browser `localStorage`.
  - ❌ Never transmitted to any third-party telemetry server.
- **Studio Loopback Bridge (Port 4243)**: Zero token typing. Localhost loopback pairing with one-click authorization.

---

## 🚀 Running ZushiAI

### Development Mode
```bash
npm run dev
```

### Build Desktop Application
```bash
npm run build
npm run tauri build
```
Or run `start-zushiai.bat` to launch the standalone executable.
