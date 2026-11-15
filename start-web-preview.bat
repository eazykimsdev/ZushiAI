@echo off
title LihForge - Web Preview (Localhost)
cd /d "%~dp0"
echo ========================================================
echo   LIHFORGE: Localhost Web Mode
echo   Starting development server...
echo   Opening http://localhost:1420 in default browser...
echo ========================================================
start "" http://localhost:1420
npm run dev
pause
