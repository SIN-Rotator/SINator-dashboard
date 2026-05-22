# SINator Dashboard — Build Plan

> **Ziel:** Web-Dashboard für den SINator Fireworks AI API-Key-Pool.  
> **Backend:** SINator-fireworksai FastAPI (`localhost:8000`) — REST API existiert bereits.  
> **Frontend:** React + Vite + TailwindCSS + shadcn/ui — reines Frontend, kein Backend-Code.

---

## Architektur

```
Browser (localhost:5173)
    │
    │  REST API calls via vite proxy
    ▼
SINator-fireworksai FastAPI (localhost:8000)
    │
    ├── GET  /health                    → {"server":"ok","chrome":true,"cua":true}
    ├── GET  /api/v1/pool/stats         → {total, used, available, keys:[...]}
    ├── POST /api/v1/rotation/full      → Full GMX→Fireworks→Key pipeline
    ├── GET  /api/v1/browser/status     → {is_running, cdp_port, page_count}
    ├── POST /api/v1/pool/use?key_id=X  → Mark key as used
    ├── POST /api/v1/pool/add           → Add key to pool
    └── DELETE /api/v1/pool/{key_id}    → Remove key
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| CSS | TailwindCSS 4 |
| UI Library | shadcn/ui (Radix-based, import components not npm) |
| Icons | lucide-react |
| HTTP | fetch (native, kein axios nötig) |
| State | React Context + useReducer (kein Zustand/Redux nötig) |

---

## Seiten & Komponenten

### 1. Dashboard Page (`/`)

**PoolStats.tsx** — 3 Karten nebeneinander:
```
┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│ 30           │ │ 29           │ │ 1            │
│ Total Keys   │ │ Available    │ │ Used         │
└─────────────┘ └──────────────┘ └──────────────┘
```

**KeyTable.tsx** — Sortable table:
```
Sortierbar nach: ID, Email, Key-Name, Status, Created
Filter: All / Available / Used / Suspended
Action-Buttons: Copy-Key, Mark-Used, Delete
Key wird NIE im Klartext angezeigt — nur per Copy-Button in Clipboard
Badges: 🟢 active, ⚪ unused, 🔴 suspended
```

**QuickActions.tsx**:
```
[Rotate Now] [Refresh Stats]
```

---

### 2. Rotation Page (`/rotation`)

**RotationPanel.tsx**:
```
┌─ Rotation Control ──────────────────────┐
│ Status: ● Idle / ◉ Running / ✓ Done     │
│                                          │
│ [Start Single Rotation]                  │
│ ── or ──                                 │
│ Loop: alle [30] min rotieren  [Start]   │
│       bis [50] keys im Pool   [Start]   │
│                                          │
│ Letzter Run: vor 3 min — cosmic-fox-123 │
│ Nächster Run: in 27 min                  │
└──────────────────────────────────────────┘
```

**LiveLog.tsx** — Letzte Rotation Steps (auto-scroll):
```
12:34:21  ✅ GMX Login (1.2s)
12:34:45  ✅ Alias Rotation — delta-hawk-456 (23s)
12:35:00  ✅ Fireworks Signup + Verify (15s)
12:36:12  ✅ Login + Onboarding (72s)
12:36:18  ✅ API Key: fw_xxx... (6s)
12:36:18  🎉 DONE — 117s total
```

---

### 3. Status Bar (unten fixiert)

```
● Chrome: running (9222)  ● CUA: active (66031)  ● Server: v8.0.0  ● Pool: 30 keys
```

---

## API Client (`src/api/client.ts`)

```typescript
const API = "/api/v1"; // proxied by vite

export async function getPoolStats(): Promise<PoolStats> {
  const r = await fetch(`${API}/pool/stats`);
  return r.json();
}

export async function startRotation(password: string): Promise<RotationResult> {
  const r = await fetch(`${API}/rotation/full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fireworks_password: password, save_to_pool: true }),
  });
  return r.json();
}

export async function getHealth(): Promise<Health> {
  const r = await fetch("/health");
  return r.json();
}
```

---

## Vite Proxy Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
```

---

## Setup Commands (für den Agenten)

```bash
# Repo klonen
git clone https://github.com/SIN-Rotator/SINator-dashboard
cd SINator-dashboard

# Projekt initialisieren
npm create vite@latest . -- --template react-ts
npm install

# Tailwind + shadcn/ui
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
npx shadcn@latest add button card table badge dialog input

# Icons
npm install lucide-react

# Dev start
npm run dev
# → http://localhost:5173
```

---

## NICHT bauen (Backend existiert bereits)

- ❌ Keine eigene Datenbank
- ❌ Kein Express/FastAPI Backend
- ❌ Keine Authentifizierung (localhost-only)
- ❌ Kein Electron/Tauri Wrapper (Web zuerst)
- ❌ Keine Key-Generierung (das macht das Backend)

---

## Wichtige Muster

- **API Keys nie im DOM rendern** — nur per Clipboard-Copy anzeigbar
- **Polling alle 10s** für Pool-Stats + Health (nicht per WebSocket)
- **Rotation läuft async** — POST `/rotation/full` blockiert ~200s. UI zeigt Spinner + Poll auf Pool-Change
- **Error-Handling**: API-Fehler im Toast anzeigen (shadcn `sonner`)

---

## Backend API (Referenz)

Start: `python agent_toolbox/start_toolbox.py` → `http://localhost:8000/docs`

### GET /health
```json
{"server":"ok","chrome":true,"cua":true,"version":"8.0.0"}
```

### GET /api/v1/pool/stats
```json
{
  "status": "success",
  "total": 30, "used": 1, "available": 29,
  "keys": [
    {"id":"abc123","alias_email":"cosmic-fox@gmx.de","key_name":"cosmic","created_at":"...","used":false}
  ],
  "execution_time": "0.00s"
}
```

### POST /api/v1/rotation/full
```json
// Request
{"fireworks_password":"ZOE.jerry2024!","save_to_pool":true}

// Response
{
  "status": "success",
  "gmx_alias": "storm-fox-123@gmx.de",
  "fireworks_account": "storm-fox-123@gmx.de",
  "api_key": "fw_xxx...",
  "api_key_name": "storm",
  "steps_completed": ["gmx_alias_rotated","fireworks_login","api_key_created","api_key_saved_to_pool"],
  "steps_failed": [],
  "execution_time": "204.5s"
}
```
