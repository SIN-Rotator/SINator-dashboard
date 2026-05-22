# SINator Dashboard

Web-Dashboard für den [SINator Fireworks AI Rotator](https://github.com/SIN-Rotator/SINator-FireworksAI). API-Key-Pool verwalten, Rotationen starten, Live-Logs ansehen.

![](public/icon.svg)

## Quick Start

```bash
git clone https://github.com/SIN-Rotator/SINator-dashboard
cd SINator-dashboard

# Backend starten (im SINator-fireworksai Repo)
cd ../SINator-fireworksai
python agent_toolbox/start_toolbox.py &

# Dashboard
cd ../SINator-dashboard
pnpm install
pnpm dev
# → http://localhost:3000
```

## Seiten

| Seite | URL | Funktion |
|-------|-----|----------|
| Dashboard | `/` | Pool-Stats, Key-Table, Quick-Actions, "API Key holen" |
| Rotation | `/rotation` | Einzel-/Loop-Modus, Live-Protokolle |
| Hilfe | `/hilfe` | FAQ + KI-Chat-Assistent (nutzt Pool-Keys!) |

## Features

- **Key-Table**: Sortier-/Filterbar, Copy-to-Clipboard, Mark-Used, Delete
- **Rotation Panel**: Single / Interval / Target-Count Loop mit Live-Log
- **Pool-Warnung**: Roter Banner wenn weniger als 3 Keys verfügbar
- **Chat-Assistent**: Nutzt `deepseek-v4-pro` via Fireworks API mit automatischem Key aus dem Pool
- **Status-Leiste**: Chrome-Backend-Status, Pool-Größe, Server-Version
- **Dark Mode**: System-Theme Auto-Detect

## Tech Stack

- Next.js 16 + React 19
- TailwindCSS 4 + shadcn/ui
- `@ai-sdk/openai-compatible` für Fireworks Chat
- Vercel AI SDK für Streaming-Chat

## API Proxy

Next.js `rewrites()` proxyen alle `/api/*` und `/health` Aufrufe an `http://localhost:8000` — das FastAPI-Backend.

## Provider

Aktuell nur **Fireworks AI** aktiv. GitHub, Vercel, GMX Provider-UI ist vorbereitet ("Soon").

## Backend Requirements

- Python 3.11+
- Chrome mit Profile 901 + Debug-Port 9222
- CUA Driver (`cua-driver serve &`)
- SINator-fireworksai FastAPI auf Port 8000
