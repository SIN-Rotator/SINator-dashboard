#!/bin/bash
# SINator Dashboard — Rebuild & Install
# Lädt nach Code-Änderungen: Next.js export → Tauri bundle → App ersetzen
set -e

DASHBOARD_DIR=~/dev/SINator-dashboard
APP_SRC="$DASHBOARD_DIR/src-tauri/target/release/bundle/macos/SINator.app"
APP_DEST="/Applications/SINator.app"

echo "🔨 SINator Dashboard — Build & Install"
echo "======================================="
echo ""

echo "[1/3] Next.js static export..."
cd "$DASHBOARD_DIR"
pnpm build

echo ""
echo "[2/3] Tauri release build..."
pnpm tauri build

echo ""
echo "[3/3] Install to /Applications..."
pkill -f "SINator.app" 2>/dev/null || true
sleep 1
rm -rf "$APP_DEST"
cp -R "$APP_SRC" "$APP_DEST"

echo ""
echo "✅ Done! App installed at $APP_DEST"
echo "   Öffne: open $APP_DEST"
echo ""
echo "⏰ NÄCHSTER SCHRITT: Backends starten —"
echo "   ~/dev/SINator-dashboard/start.sh  (Fireworks + HeyPiggy + App)"
