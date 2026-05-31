# SINator Dashboard

[![GitNexus](https://img.shields.io/badge/GitNexus-knowledge%20graph-8B5CF6)](.gitnexus/)

Tauri Web-Dashboard für den SINator-Rotator. Verwaltet den Fireworks API-Key-Pool, zeigt Live-Statistiken mit echtem `leased`-Count, steuert Rotation.

**Backend Repo:** [SINator-FireworksAI](https://github.com/SIN-Rotator/SINator-FireworksAI) |
**HeyPiggy Repo:** [SINator-heypiggy](https://github.com/SIN-Rotator/SINator-heypiggy)

## Quick Start

```bash
cd ~/dev/SINator-dashboard
./start.sh
# → Backend (:8000) + Dashboard (:3000) + Tauri App
```

Nach Code-Änderungen:
```bash
./build.sh
# → Next.js export → Tauri build → /Applications/SINator.app
```

## Seiten

| Seite | URL | Funktion |
|-------|-----|----------|
| Dashboard | `/` | Pool-Stats, Key-Table, Key holen |
| Rotation | `/rotation` | Rotation starten/stoppen, Live-Log |
| Setup | `/setup` | GMX-Zugangsdaten, Pool-API-Config |
| Hilfe | `/hilfe` | KI-Chat-Assistent (gpt-oss-120b) |

## Setup-Seite (`/setup`)

- **GMX Konto**: Email + Passwort für Alias-Rotation (Backend `config.json`)
- **Pool-API Config**: opencode.json mit **12 Modellen**, Cursor, Continue, Python SDK — alle mit EINER Base-URL
- **Live-Key**: Geleaster API-Key als Beispiel
- **Keine Passwort-Fallbacks** im Frontend!

## Pool-Statistiken

| Feld | Bedeutung |
|------|-----------|
| `total` | Alle Keys im Pool |
| `available` | **Wirklich** verfügbar (exkl. leased) |
| `leased` | Von Proxys reserviert |
| `used` | Manuell verbraucht |
| `suspended` | Von Fireworks gesperrt |

## OpenCode 12 Modelle

```
deepseek-v4-pro     → fireworks/deepseek-v4-pro              1M Kontext
deepseek-v4-flash   → accounts/fireworks/models/...flash     1M Kontext
glm-5p1             → fireworks/glm-5p1                      202K
glm-5p1-fast        → accounts/fireworks/routers/...fast     202K
kimi-k2p5           → accounts/fireworks/models/...k2p5      262K + Vision
kimi-k2p6           → fireworks/kimi-k2p6                    262K + Vision
kimi-k2p6-turbo     → accounts/fireworks/routers/...turbo    262K + Vision
qwen3p6-plus        → accounts/fireworks/models/...plus      131K + Vision
minimax-m2p5        → accounts/fireworks/models/...m2p5      196K
minimax-m2p7        → fireworks/minimax-m2p7                 196K
gpt-oss-120b        → accounts/fireworks/models/...120b      131K
gpt-oss-20b         → accounts/fireworks/models/...20b       131K
```

## Provider

| Provider | Backend | Status |
|----------|---------|--------|
| Fireworks AI | :8000 | ✅ Aktiv |
| HeyPiggy | :8002 | ✅ Aktiv |

Provider-Switcher im Header.

## Features

- **Pool-Stats mit echtem `leased`**: `available` exkludiert reservierte Keys
- **Key-Table**: Sortierbar, Copy, Mark-Used, Delete
- **Rotation**: Single / Intervall / Loop bis Zielanzahl
- **Proxy 1s Key-Retry**: Proxy retried intern alle 1s, kein 3-Minuten-Client-Timeout
- **Pool-Warnung**: Roter Banner bei <3 Keys
- **Chat-Assistent**: Rust-Command (gpt-oss-120b) via Pool-Proxy
- **Setup-Formular**: GMX + Fireworks Credentials
- **Dark Mode**: System-Theme

## Tech Stack

- Next.js 16 + React 19 (Static Export)
- TailwindCSS 4 + shadcn/ui
- Tauri v2 (Rust + WebView)
- Rust: `reqwest`, `tokio`, `futures-util`

---

*Stand: 2026-05-31 | V15.4 | [SINator-FireworksAI](https://github.com/SIN-Rotator/SINator-FireworksAI) Pool: 235 Keys*
