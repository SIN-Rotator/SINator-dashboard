# hooks/use-sinator.ts

Dashboard State Hook — zentraler Polling-Loop für Health, Browser-Status, Pool-Stats. Provider-aware — wechselt Backend beim Provider-Switch. 10s Poll-Intervall.

## Berührt

- `components/pool-stats.tsx` — Zeigt `stats` (total, available, used)
- `components/key-table.tsx` — Zeigt `stats.keys` Liste
- `components/status-bar.tsx` — Zeigt `connected`, `health`
- `components/header.tsx` — Nutzt `provider` Context
- `components/pool-warning.tsx` — Warnt wenn `stats.available < 3`
- `lib/api.ts` — `getHealth()`, `getBrowserStatus()`, `getPoolStats()`

## State

```typescript
interface SinatorState {
  health: Health | null       // Backend + Chrome + CUA Status
  browser: BrowserStatus | null // CDP Port + Running + Pages
  stats: PoolStats | null     // Pool: total, used, suspended, available, keys
  connected: boolean          // Mindestens ein API-Call erfolgreich
  loading: boolean            // Erster Load läuft
  refresh: () => Promise<void> // Manueller Refresh
}
```

## Flow

```
useSinator(10000) mount:
  → refresh():
    Promise.allSettled([
      getHealth(backendUrl),        // GET /health
      getBrowserStatus(),           // GET /api/v1/browser/status
      getPoolStats(backendUrl, prefix) // GET {backend}{prefix}/pool/stats
    ])
  → setInterval(refresh, 10000)

Provider-Wechsel:
  → stats = null (Reset)
  → loading = true
  → refresh() → neu laden
```

## Wichtige Entscheidungen

- **Poll-Intervall:** 10s (configurable via `pollMs` param)
- **Provider-Reset:** Beim Provider-Wechsel → stats zurückgesetzt → neu geladen
- **`Promise.allSettled`:** Einzelne Fehler killen nicht den ganzen Refresh
- **`connected`:** true wenn IRGENDEIN Call erfolgreich (Health ODER Stats)
- **Kein SSE:** Polling, nicht EventStream (SSE ist in pool.tsx separat)
