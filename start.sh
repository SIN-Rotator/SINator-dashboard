#!/bin/bash
# SINator App Launcher — startet alle Services + Tauri Fenster

PY=/opt/homebrew/bin/python3
FIREWORKS_DIR=~/dev/SINator-fireworksai
HEYPIGGY_DIR=~/dev/SINator-heypiggy
DASHBOARD_DIR=~/dev/SINator-dashboard

echo "🚀 SINator App Launcher"
echo "======================"
echo ""

# Cleanup stale processes
echo "🧹 Cleaning up old processes..."
for port in 8000 8002 3000; do
  lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 1

# 1. Fireworks Backend (port 8000)
echo "[1/3] Fireworks Backend → :8000"
cd "$FIREWORKS_DIR"
nohup "$PY" agent_toolbox/start_toolbox.py > /tmp/sinator-fireworks.log 2>&1 &
echo "  Started PID $!"

# 2. HeyPiggy Backend (port 8002)
echo "[2/3] HeyPiggy Backend → :8002"
cd "$HEYPIGGY_DIR"
nohup "$PY" agent_toolbox/start_toolbox.py > /tmp/sinator-heypiggy.log 2>&1 &
echo "  Started PID $!"

# 3. Dashboard Next.js (port 3000)
echo "[3/3] Dashboard Next.js → :3000"
cd "$DASHBOARD_DIR"
nohup pnpm dev --port 3000 > /tmp/sinator-dashboard.log 2>&1 &
echo "  Started PID $!"

# Wait for all services
echo ""
echo "⏳ Waiting for services to be ready..."
for i in $(seq 1 30); do
  FW=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "---")
  HP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health 2>/dev/null || echo "---")
  DB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "---")
  
  printf "  [%2d] Fireworks:%s  HeyPiggy:%s  Dashboard:%s\r" "$i" "$FW" "$HP" "$DB"
  
  if [ "$FW" = "200" ] && [ "$HP" = "200" ] && [ "$DB" = "200" ]; then
    echo ""
    echo ""
    echo "✅ All services ready!"
    break
  fi
  sleep 2
done

echo ""
echo "🌐 Opening browser → http://localhost:3000"
open "http://localhost:3000"

cd "$DASHBOARD_DIR"
echo "🖥️  Starting Tauri dev... (close this terminal to stop)"
echo ""
pnpm tauri dev
