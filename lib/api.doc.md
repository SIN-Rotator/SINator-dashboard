# lib/api.ts

Dashboard API Client für SINator FastAPI Backends. TypeScript Interface + fetch-Wrapper für Pool-Stats, Rotation, Key-Management, Config. Provider-agnostisch — jeder Provider hat eigenes `backendUrl`.

## Berührt

- `hooks/use-sinator.ts` — Polling-Loop ruft `getHealth()`, `getPoolStats()`, `getBrowserStatus()`
- `components/rotation-panel.tsx` — `startRotation()` für "Key holen"
- `components/key-table.tsx` — `markKeyUsed()`, `deleteKey()`, `revealKey()`
- `app/setup/page.tsx` — `getConfig()`, `saveConfig()`
- `components/chat-panel.tsx` — indirect via Tauri `chat_send`

## Types

| Interface | Felder |
|-----------|--------|
| `PoolKey` | id, alias_email, key_name, created_at, used, suspended |
| `PoolStats` | status, total, used, suspended, leased, available, keys |
| `Health` | server, chrome, cua, version |
| `BrowserStatus` | is_running, cdp_port, page_count |
| `RotationResult` | status, gmx_alias, api_key, steps_completed, steps_failed |
| `ConfigData` | gmx_email, gmx_password, fireworks_password |

## Endpoints

| Funktion | API Call |
|----------|----------|
| `getHealth()` | GET /health |
| `getBrowserStatus()` | GET /api/v1/browser/status |
| `getPoolStats(backendUrl, apiPrefix)` | GET {backend}{prefix}/pool/stats |
| `startRotation(backendUrl, apiPrefix, password)` | POST {backend}{prefix}/rotation/full |
| `markKeyUsed(backendUrl, apiPrefix, keyId)` | POST {backend}{prefix}/pool/use |
| `deleteKey(backendUrl, apiPrefix, keyId)` | DELETE {backend}{prefix}/pool/credential/{id} |
| `revealKey(backendUrl, apiPrefix, keyId)` | GET {backend}{prefix}/pool/reveal/{id} |
| `getConfig(apiPrefix)` | GET /api/v1/config |
| `saveConfig(apiPrefix, data)` | POST /api/v1/config |

## Wichtige Entscheidungen

- **Default Backend:** `http://localhost:8000` — Fireworks Backend
- **`cache: "no-store"`** bei allen reads — verhindert stale Next.js Cache
- **Provider-Parameter:** `backendUrl` + `apiPrefix` — Flexibel für HeyPiggy (:8002) und Fireworks (:8000)
- **Kein Auth-Token:** API ist public für localhost
