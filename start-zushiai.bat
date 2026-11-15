@echo off
cd /d "%~dp0"
echo Starting ZushiAI Desktop...
if exist "zushiai.exe" (
    start "" "zushiai.exe"
) else if exist "lihforge.exe" (
    start "" "lihforge.exe"
) else if exist "src-tauri\target\release\zushiai.exe" (
    start "" "src-tauri\target\release\zushiai.exe"
) else if exist "src-tauri\target\release\lihforge.exe" (
    start "" "src-tauri\target\release\lihforge.exe"
) else (
    echo Running development server...
    npm run dev
)
