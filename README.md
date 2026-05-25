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
| Hilfe | `/hilfe` | FAQ + KI-Chat-Assistent (gpt-oss-120b via Rust Command) |
| Setup | `/setup` | GMX + Fireworks Zugangsdaten konfigurieren |

## Features

- **Key-Table**: Sortier-/Filterbar, Copy-to-Clipboard (Tauri Clipboard), Mark-Used, Delete
- **Rotation Panel**: Single / Interval / Target-Count Loop mit Live-Log
- **Pool-Warnung**: Roter Banner wenn weniger als 3 Keys verfügbar
- **Chat-Assistent**: Rust-Command `chat_send` via Pool-Proxy (gpt-oss-120b, $0.15/M), Live-Pool-Stats im System-Prompt
- **Setup-Seite**: GMX Email/Passwort + Fireworks Passwort — gespeichert in `data/config.json`
- **Status-Leiste**: Chrome-Backend-Status, Pool-Größe, Server-Version
- **Dark Mode**: System-Theme Auto-Detect

## Pool Stats (V11)

```
112 Keys total
  60 verfügbar (available = total - used - suspended)
  44 gesperrt  (suspended by Fireworks)
   8 verbraucht (manually marked used)
```

Keys are encrypted in **macOS Keychain** (`com.sinator.pool`). Pool JSON contains only SENTINEL values — real keys via `GET /pool/reveal/{key_id}`.

## Remote Setup (für Familie)

Any OpenAI-compatible client can use the pool:

```
baseURL: https://sinator.delqhi.com/inference/v1
apiKey:  7avN1KkfInNqcOMn2CtwLTvx
```

**opencode:** In `~/.config/opencode/opencode.json` den Provider `fireworks-ai` mit `baseURL: "https://sinator.delqhi.com/inference/v1"` anlegen. Dann in `~/.zshrc`:
```bash
export FIREWORKS_API_KEY="7avN1KkfInNqcOMn2CtwLTvx"
```

**Cursor / Continue / etc.:** Base URL + API Key in den Settings eintragen.

> Local users (localhost) don't need the API key — proxy skips auth for `127.0.0.1`.

## Tech Stack

- Next.js 16 + React 19
- TailwindCSS 4 + shadcn/ui
- Tauri v2 (Rust + WebView, Clipboard + Chat Commands)
- Rust: `reqwest`, `tokio`, `futures-util` für Chat-Proxy-Integration
- Static Export (keine Next.js API Routes!)

## API Proxy

Next.js `rewrites()` proxyen alle `/api/*` und `/health` Aufrufe an `http://localhost:8000` — das FastAPI-Backend.

**Chat** nutzt KEINEN Frontend-Fetch (Tauri WebView blockiert `fetch()` zu `localhost:8888`). Stattdessen: Rust `chat_send` Command → reqwest → Pool-Proxy.

## Provider

Aktuell nur **Fireworks AI** aktiv. GitHub, Vercel, GMX Provider-UI ist vorbereitet ("Soon").

## Backend Requirements

- Python 3.11+
- Chrome mit Profile 901 + Debug-Port 9222 (OHNE `--force-renderer-accessibility`!)
- CUA Driver (`cua-driver serve &`)
- SINator-fireworksai FastAPI auf Port 8000
- Pool-Proxy auf Port 8888
- macOS Keychain (für API-Key-Verschlüsselung)
