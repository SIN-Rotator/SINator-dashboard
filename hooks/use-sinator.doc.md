# hooks/use-sinator.ts

Dashboard State Hook — zentraler Polling-Loop für Health und Pool-Stats. Provider-aware — wechselt Backend beim Provider-Switch. 10s Poll-Intervall.

## Berührt

- `components/pool-stats.tsx` — Zeigt `stats` (total, available, used)
- `components/key-table.tsx` — Zeigt `stats.keys` Liste
- `components/status-bar.tsx` — Zeigt `connected`, `health`
- `components/header.tsx` — Nutzt `provider` Context
- `components/pool-warning.tsx` — Warnt wenn `stats.available < 3`
- `lib/api.ts` — `getHealth()`, `getPoolStats()`
- `lib/providers.ts` — `provider.poolPrefix` für shared Pool-Routen

## State

```typescript
interface SinatorState {
  health: Health | null       // Backend Status
  stats: PoolStats | null     // Pool: total, used, suspended, available, keys
  connected: boolean          // Health API-Call erfolgreich
  loading: boolean            // Erster Load läuft
  refresh: () => Promise<void> // Manueller Refresh
}
```

## Flow

```
useSinator(10000) mount:
  → refresh():
    Promise.allSettled([
      getHealth(backendUrl),                 // GET /health
      getPoolStats(backendUrl, poolPrefix)   // GET {backend}{poolPrefix}/pool/stats
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
- **`connected`:** true wenn Health-Call erfolgreich
- **Kein SSE:** Polling, nicht EventStream (SSE ist in pool.tsx separat)
- **BrowserStatus entfernt** — Route `/api/v1/browser/status` in Backend V15.4 gelöscht
