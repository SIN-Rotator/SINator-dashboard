# SINator Dashboard

Web-Dashboard für den SINator Rotator. Verwaltet Fireworks API Keys + HeyPiggy Accounts. Pool-Statistiken, Rotation, Live-Logs.

## Quick Start (Alles automatisch)

```bash
cd ~/dev/SINator-dashboard
./start.sh
# → Startet Fireworks (:8000) + HeyPiggy (:8002) + Dashboard (:3000) + Tauri App
```

## Nach Code-Änderungen — App neu bauen

```bash
cd ~/dev/SINator-dashboard
./build.sh
# → Next.js export → Tauri build → Installiert nach /Applications/SINator.app
```

**Wichtig:** Die Tauri App ist statisch (kein Hot-Reload). Nach JEDER Änderung an `lib/`, `components/`, `hooks/` oder `app/` muss `./build.sh` laufen, sonst zeigt die App alten Code.

## Seiten

| Seite | URL | Funktion |
|-------|-----|----------|
| Dashboard | `/` | Pool-Stats, Key-Table, "Account/Key holen", Provider-Switcher |
| Rotation | `/rotation` | Einzel-/Loop-Modus, Live-Protokolle |
| Hilfe | `/hilfe` | FAQ + KI-Chat-Assistent |
| Setup | `/setup` | GMX + Fireworks Zugangsdaten konfigurieren |

## Provider

| Provider | Backend | Pool | Status |
|----------|---------|------|--------|
| Fireworks AI | `:8000` | `fireworksai-pool.json` | ✅ Aktiv |
| HeyPiggy | `:8002` | `heypiggy-pool.json` | ✅ Aktiv |
| GitHub | `:8000` | — | 🚧 Vorbereitet |
| Vercel | `:8000` | — | 🚧 Vorbereitet |
| GMX Aliase | `:8000` | — | 🚧 Vorbereitet |

Provider-Switcher oben rechts im Header — HeyPiggy auf PiggyBank Icon (pink) umschalten.

## Features

- **Provider-Switcher**: Fireworks / HeyPiggy / GitHub / Vercel / GMX umschaltbar
- **Key-Table**: Sortier-/Filterbar, Copy-to-Clipboard, Mark-Used, Delete
- **Rotation Panel**: Single / Interval / Target-Count Loop mit Live-Log
- **Pool-Warnung**: Roter Banner wenn weniger als 3 Keys verfügbar
- **Chat-Assistent**: Rust-Command via Pool-Proxy (gpt-oss-120b)
- **Setup**: GMX Email/Passwort + Fireworks Passwort
- **Dark Mode**: System-Theme Auto-Detect

## Remote Setup

```
baseURL: https://sinator.delqhi.com/inference/v1
apiKey:  7avN1KkfInNqcOMn2CtwLTvx
```

## Tech Stack

- Next.js 16 + React 19 (Static Export)
- TailwindCSS 4 + shadcn/ui
- Tauri v2 (Rust + WebView, Clipboard + Chat Commands)
- Rust: `reqwest`, `tokio`, `futures-util` für Chat-Proxy
- Backend: FastAPI (Python), CDP/Browser-Automation
