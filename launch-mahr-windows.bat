@echo off
title MAHR // Cognitive Ambient OS (Windows Launcher)
echo ========================================================
echo   MAHR OS - Native Windows Desktop Launcher
echo   Cross-Platform Cognitive Intelligence System
echo ========================================================
echo.
echo [1/3] Checking environment runtime...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Verifying dependencies...
if not exist "node_modules" (
    echo Installing required packages...
    call npm install
)

echo [3/3] Launching MAHR in Native Desktop Window...
echo Global Hotkey: Ctrl+Shift+M will summon MAHR anytime.
echo.

call npm run electron:start

pause
