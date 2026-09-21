#!/usr/bin/env bash
# MAHR // Cognitive Ambient OS (Linux Launcher)
# Compatible with Ubuntu, Debian, Fedora, Arch, Manjaro

set -e

echo "========================================================"
echo "  MAHR OS - Native Linux Desktop Launcher"
echo "  Compatible with X11 & Wayland Desktop Sessions"
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not found. Please install Node.js (v18+) via your package manager."
    exit 1
fi

echo "[1/2] Checking workspace dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing application dependencies..."
    npm install
fi

echo "[2/2] Launching MAHR Native Linux Desktop Client..."
echo "Global Hotkey: Ctrl+Shift+M will summon MAHR."
echo ""

npm run electron:start
