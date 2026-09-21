@echo off
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

REM 1. Check for Electron runtime
where electron >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    if exist "%APP_DIR%resources\app.asar" (
        start "" electron "%APP_DIR%resources\app.asar"
        exit /b 0
    )
    if exist "%APP_DIR%main.cjs" (
        start "" electron "%APP_DIR%"
        exit /b 0
    )
)

REM 2. Check for Node runtime executing bytecode entry point
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    if exist "%APP_DIR%main.cjs" (
        start "" node "%APP_DIR%main.cjs"
        exit /b 0
    )
    start "" node "%APP_DIR%desktop-runner.cjs"
    exit /b 0
)

REM 3. Fallback to lightweight PowerShell loopback server
start "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%APP_DIR%win-server.ps1"
exit /b 0

