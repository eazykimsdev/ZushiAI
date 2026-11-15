@echo off
title LihForge - AI Roblox Game Builder
cd /d "%~dp0"

echo ========================================================
echo   LIHFORGE: AI Roblox Game Builder
echo ========================================================

if exist "%~dp0lihforge.exe" (
    echo Starting LihForge Desktop Application...
    start "" "%~dp0lihforge.exe"
    exit /b
)

if exist "%~dp0src-tauri\target\release\lihforge.exe" (
    echo Starting LihForge Desktop Application...
    start "" "%~dp0src-tauri\target\release\lihforge.exe"
    exit /b
)

echo lihforge.exe not found in release, launching development runtime...
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%USERPROFILE%\.cargo\bin;%PATH%"
npm run tauri dev
pause
