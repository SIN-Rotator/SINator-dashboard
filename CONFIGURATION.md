# SINator Dashboard — Konfiguration

---

## 1. Environment Variables

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend-URL für Fireworks API |
| `NEXT_PUBLIC_HEYPIGGY_URL` | `http://localhost:8002` | Backend-URL für HeyPiggy API |

---

## 2. Backend-Anbindung

Das Dashboard erwartet laufende Backends:

| Backend | Default URL | Port |
|---------|-------------|------|
| SINator-fireworksai | `http://localhost:8000` | `:8000` |
| SINator-heypiggy | `http://localhost:8002` | `:8002` |

Bei Remote-Betrieb die `NEXT_PUBLIC_API_URL` entsprechend setzen (z.B. `https://sinator.delqhi.com`).

---

## 3. Tauri Config

**Datei:** `src-tauri/tauri.conf.json`

| Setting | Standard | Beschreibung |
|---------|----------|-------------|
| `app.window.title` | `SINator` | Fenstertitel |
| `app.security.csp` | `default-src 'self'` | Content Security Policy |
| `app.security.allowlist` | — | Erlaubte Protokolle (z.B. `clipboard:read`, `clipboard:write`) |

**Chat-Assistent Config:**
- **Datei:** `src-tauri/chat-system-prompt.txt`
- **Modell:** `accounts/fireworks/models/gpt-oss-120b` (via Pool-Router)
- **Pool-Router URL:** `https://sinatorpool-router.delqhi.com/inference/v1` (hardcoded in `main.rs`)

---

## 4. Dashboard Settings (UI)

**Setup-Seite (`/setup`):**
- GMX Email
- GMX Passwort
- Fireworks Passwort

Wird via `POST /api/v1/config` an SINator-fireworksai Backend gespeichert.

---

## 5. OpenCode Provider Config

Für CLI/OpenCode Integration die Pool-Router URL in `~/.config/opencode/opencode.json` eintragen:

```json
{
  "provider": {
    "fireworks-ai": {
      "options": {
        "baseURL": "https://sinatorpool-router.delqhi.com/inference/v1",
        "apiKey": "<DEIN_API_KEY>"
      }
    }
  }
}
```

---

## 6. Build-Konfiguration

**Datei:** `next.config.mjs`
- Static Export (`output: 'export'`)
- Tauri Build via `build.sh`

---

*Stand: 2026-05-30 | Tauri v2 | Next.js 16*
