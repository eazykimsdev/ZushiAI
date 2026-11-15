@echo off
title ZushiAI - AI Roblox Game Builder
cd /d "%~dp0"

echo ========================================================
echo   ZUSHIAI: AI Roblox Game Builder
echo ========================================================

if exist "%~dp0zushiai.exe" (
    echo Starting ZushiAI Desktop Application...
    start "" "%~dp0zushiai.exe"
    exit /b
)

if exist "%~dp0src-tauri\target\release\zushiai.exe" (
    echo Starting ZushiAI Desktop Application...
    start "" "%~dp0src-tauri\target\release\zushiai.exe"
    exit /b
)

if exist "%~dp0lihforge.exe" (
    echo Starting ZushiAI Desktop Application...
    start "" "%~dp0lihforge.exe"
    exit /b
)

if exist "%~dp0src-tauri\target\release\lihforge.exe" (
    echo Starting ZushiAI Desktop Application...
    start "" "%~dp0src-tauri\target\release\lihforge.exe"
    exit /b
)

echo Starting development server on http://localhost:5173...
npm run dev
