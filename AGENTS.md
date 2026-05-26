# AGENTS.md — SINator Dashboard (2026-05-26)

## Quick Commands

```bash
# App starten (alles automatisch)
cd ~/dev/SINator-dashboard && ./start.sh

# Nach Code-Änderungen — App NEU BAUEN (!)
cd ~/dev/SINator-dashboard && ./build.sh
```

## ⚠️ ABSOLUTE REGEL: Tauri Release Build

Die Tauri `.app` ist **statisch** (Next.js `output: "export"`). Sie hat **kein Hot-Reload**.
Nach JEDER Änderung an `lib/`, `components/`, `hooks/`, `app/` MUSS `./build.sh` laufen.

- `pnpm dev` → Next.js Dev Server (:3000) — Hot-Reload, nur für Browser
- `pnpm tauri dev` → Tauri Dev (verbindet sich mit :3000) — Hot-Reload  
- `pnpm build && pnpm tauri build` → Tauri Release (statisch) — **muss manuell gebaut werden**

## Provider-Architektur

`lib/providers.ts` — Einzige Quelle für Provider-Konfiguration:

```typescript
{
  id: "heypiggy",
  backendUrl: "http://localhost:8002",   // HeyPiggy Backend
  apiPrefix: "/api/v1",
  itemNoun: "Account",
  icon: PiggyBank,
  accent: "text-pink-500",
}
```

Jeder Provider hat eigenes `backendUrl` + `apiPrefix`. Das Dashboard (`useSinator` hook, `api.ts`) verwendet `${backendUrl}${apiPrefix}` für alle API-Calls.

## Backend URLs

| Provider | Backend URL | Repo |
|----------|------------|------|
| Fireworks AI | `http://localhost:8000` | SINator-fireworksai |
| HeyPiggy | `http://localhost:8002` | SINator-heypiggy |
| GitHub | `http://localhost:8000` | (shared) |
| Vercel | `http://localhost:8000` | (shared) |
| GMX | `http://localhost:8000` | (shared) |

## Dateien

- `lib/providers.ts` — Provider Registry (Backend URLs, Labels, Icons)
- `lib/api.ts` — API Client (`apiUrl(backendUrl, path)`, fetch wrapper)
- `hooks/use-sinator.ts` — Dashboard State (health, stats, browser)
- `components/provider-context.tsx` — Active Provider Context (localStorage)
- `components/provider-switcher.tsx` — Dropdown Menu für Provider-Wechsel
- `components/key-table.tsx` — `provider.itemNoun` für Labels
- `components/get-key-hero.tsx` — "Account/Key holen" Button
- `start.sh` — Startet Fireworks + HeyPiggy + Dashboard
- `build.sh` — Next.js export → Tauri build → /Applications installieren
