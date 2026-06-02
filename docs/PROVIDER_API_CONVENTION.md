# SINator Provider API Convention

> **This document is the CONTRACT between the SINator Dashboard and any
> Rotator-Backend.** Any new Rotator that does not implement this convention
> will not work in the Dashboard. Read this BEFORE building a new Rotator.

## Why this exists

Before this convention, the Dashboard was hard-coded to the Fireworks backend's
API shape. When you clicked "HeyPiggy" in the provider switcher, the Dashboard
tried to call Fireworks-shaped endpoints on a different port → "Backend ist
offline" error, even though the HeyPiggy backend was running.

The fix: every Rotator-Backend implements the **same standard API**. The
Dashboard's `Provider-Adapter` maps UI actions (Holen / Generieren / Refresh)
to provider-specific endpoints, but the **response shape** is identical across
providers.

---

## 🔌 Port Convention (Eindeutige Ports)

**Jeder Rotator bekommt seinen eigenen, dokumentierten Port.** Niemals Port 8000
für mehrere Services verwenden — macOS launchd schließt/killt Prozesse bei
Port-Kollisionen.

### Offizielle Port-Range: 8100-8109

| Port | Service | Rotator-Repo |
|------|---------|--------------|
| `8100` | sinator-fireworks (Backend) | `SINator-fireworksai` |
| `8101` | sinator-heypiggy (Backend)  | `SINator-heypiggy` |
| `8102` | sinator-v0 / vercel (Backend) | `SINator-Vercel` |
| `8103` | sinator-github (Backend)  | `SINator-github` (future) |
| `8104` | sinator-openrouter (Backend) | `SINator-openrouter` (future) |
| `8105-8109` | **RESERVED** | future rotators |
| `8000` | **DEPRECATED** — Fireworks legacy | (kept for back-compat only) |
| `8001` | **DEPRECATED** — HeyPiggy legacy  | (kept for back-compat only) |
| `8002` | **DEPRECATED** — Vercel legacy    | (kept for back-compat only) |
| `8040` | sinator-pages (static Dashboard) | `SINator-dashboard` |
| `8888-8897` | sinator-pool-proxy (10 instances) | `SINator-fireworksai/proxy` |
| `9998` | sinator-pool-router (CF-Tunnel entry) | `SINator-fireworksai/scripts` |

**RULE:** A new Rotator picks the next free port in `8100-8109` and adds it to
this table. The Dashboard's `providers.ts` MUST use the new port.

---

## 📡 Required API Endpoints (Standard)

Every Rotator-Backend MUST implement these endpoints. Request/response shapes
are FIXED — the Dashboard parses them directly.

### 1. `GET /health`

Standard liveness check. The Dashboard calls this FIRST to determine if the
backend is reachable.

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "rotator": "heypiggy",
  "chrome": false,
  "cua": false
}
```

**Required fields:**
- `status` — `"ok"` if backend is ready, anything else → Dashboard shows "Backend offline"
- `rotator` — string identifier (matches `ProviderConfig.id` in dashboard)
- `version` — semver of the rotator backend
- `chrome` — boolean, true if Chrome browser automation is active
- `cua` — boolean, true if CUA (Computer-Use Agent) is active

### 2. `GET {poolPrefix}/pool/stats`

Pool statistics — used by the Dashboard's stat cards (Gesamt / Verfügbar / Verbraucht).

**Response (200 OK):**
```json
{
  "status": "success",
  "total": 256,
  "used": 0,
  "suspended": 176,
  "leased": 0,
  "available": 80,
  "keys": [
    {
      "id": "uuid-here",
      "alias_email": "recovered-uuid@unknown.local",
      "key_name": "key-name",
      "api_key": "",
      "created_at": "2026-06-02T08:00:17Z",
      "used": false,
      "used_at": null,
      "suspended": true,
      "suspended_at": "2026-06-02T08:01:10Z",
      "suspended_reason": "suspended",
      "leased": false,
      "leased_to": null
    }
  ]
}
```

**Required fields:**
- `total`, `used`, `suspended`, `leased`, `available` — all integers
- `keys[]` — array of key/credential objects (may be empty)
- Each key MUST have: `id`, `alias_email`, `key_name`, `created_at`, `used`, `suspended`, `leased`

**`{poolPrefix}`:** provider-specific (e.g. `/api/v1` for most, but each provider may customize)

### 3. `GET {poolPrefix}/pool/lease`

Atomically lease one item from the pool. Used by the "Holen" button.

**Query params:**
- `leased_to` (optional) — identifier of the lessee, e.g. `dashboard-{timestamp}`

**Response (200 OK):**
```json
{
  "status": "success",
  "api_key": "fw_ABC123...",
  "key_id": "uuid-here",
  "alias_email": "alias@gmx.de",
  "key_name": "my-key"
}
```

**Response (404):**
```json
{"detail": "No available keys to lease"}
```

### 4. `POST {apiPrefix}/rotation/full`

Trigger a fresh rotation (create new account + generate item). Used by the
"Generieren" button.

**Body:**
```json
{
  "fireworks_password": "optional-override",
  "heypiggy_password": "optional-override",
  "save_to_pool": true
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "gmx_alias": "new-alias@gmx.de",
  "fireworks_account": "new-alias@gmx.de",
  "heypiggy_account": "new-alias@gmx.de",
  "api_key": "fw_NEW_KEY",
  "api_key_name": "new-key",
  "credential_id": "uuid",
  "steps_completed": ["gmx_alias_rotated", "fireworks_login", "api_key_created"],
  "steps_failed": [],
  "execution_time": "158.3s"
}
```

**Required fields (success):** `status="success"`, `gmx_alias`, `api_key`, `steps_completed[]`, `steps_failed[]`, `execution_time`

### 5. `POST {poolPrefix}/pool/return`

Return a leased item to make it available again.

**Body:** `{"key_id": "uuid", "lease_id": "optional"}`

**Response (200):** `{"status": "success", "key_id": "uuid"}`

### 6. `GET {apiPrefix}/health` (legacy alias)

Some backends expose `/health` at root AND at `/api/v1/health`. The Dashboard
uses root `/health` only.

---

## 🔐 Auth Convention

All Rotator-Backends share the same auth token via env var `SINATOR_AUTH_TOKEN`.

- Public endpoints (no auth): `/health`, `/docs`, `/redoc`, `/openapi.json`, `/`
- Authenticated: all `/api/*` routes
- Header: `Authorization: Bearer <token>`

The Dashboard auto-sends the token from the Tauri secure storage.

---

## 🧩 Provider-Adapter Pattern (Dashboard-side)

The Dashboard NEVER calls `{apiPrefix}/pool/stats` directly. Instead it goes
through a `ProviderAdapter` that maps standard UI operations to the
provider-specific endpoints.

```typescript
// lib/providers.ts (simplified)
export interface ProviderConfig {
  id: ProviderId
  label: string
  // ... UI strings, icons, etc.
  backendUrl: string    // e.g. "http://localhost:8100" — MUST be unique!
  apiPrefix: string     // e.g. "/api/v1" — provider-specific routes
  poolPrefix: string    // e.g. "/api/v1" — shared pool routes
  capabilities: {
    hasPool: boolean          // supports /pool/stats, /pool/lease
    hasRotation: boolean      // supports /rotation/full
    hasTerminalRotation: boolean  // requires Tauri terminal (for browser-based rotators)
    hasApiKeys: boolean       // stores API keys (vs. email+password credentials)
  }
}
```

The Dashboard's `lib/api.ts` has a `getProviderAdapter(provider)` that returns
the right adapter for each provider. Adapters translate:

| UI Action | Adapter Call | Maps to |
|-----------|-------------|---------|
| Refresh stats | `adapter.getPoolStats()` | `GET {poolPrefix}/pool/stats` |
| Holen (1) | `adapter.leaseItem()` | `GET {poolPrefix}/pool/lease` |
| Generieren (1) | `adapter.rotateItem()` | `POST {apiPrefix}/rotation/full` OR `invoke("open_terminal_rotate")` |
| Holen (multi) | `adapter.leaseMultiple(n)` | n × `leaseItem()` |
| Mark used | `adapter.markUsed(keyId)` | `POST {poolPrefix}/pool/use?key_id=...` |
| Delete | `adapter.deleteKey(keyId)` | `DELETE {poolPrefix}/pool/credential/{id}` |
| Reveal | `adapter.revealKey(keyId)` | `GET {poolPrefix}/pool/reveal/{id}` |

---

## 🆕 Adding a New Rotator (CHECKLIST)

When you build a new Rotator (e.g. `SINator-openrouter`), follow this checklist:

### Step 1: Pick a port
- Choose next free port from `8100-8109` table
- Add entry to the table above
- Document why this port

### Step 2: Implement the standard API
In your new Rotator's `agent_toolbox/`, implement:
- `GET /health` — must return the standard health shape with `rotator: "openrouter"`
- `GET /api/v1/pool/stats` — standard shape
- `GET /api/v1/pool-lease` — standard shape
- `POST /api/v1/rotation/full` — standard shape
- (optional) `POST /api/v1/pool/return`, `POST /api/v1/pool/use`, etc.

### Step 3: Add to Dashboard's `providers.ts`
```typescript
const OPENROUTER: ProviderConfig = {
  id: "openrouter",
  label: "OpenRouter",
  shortLabel: "OpenRouter",
  // ... UI strings
  backendUrl: "http://localhost:8104",  // ← your new port!
  apiPrefix: "/api/v1",
  poolPrefix: "/api/v1",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: true,   // browser-based → needs terminal
    hasApiKeys: true,
  },
  // ... rest
}
```

### Step 4: Create LaunchAgent with port
```xml
<key>EnvironmentVariables</key>
<dict>
  <key>TOOLBOX_PORT</key>
  <string>8104</string>  <!-- your unique port! -->
  <key>SINATOR_AUTH_TOKEN</key>
  <string>7avN1KkfInNqcOMn2CtwLTvx</string>
</dict>
```

### Step 5: Test in Dashboard
- Open Dashboard → Provider-Switcher → OpenRouter
- Verify: stat cards show real numbers, "Account holen" works, "Account generieren" works
- Verify: no "Backend offline" error

### Step 6: Update this doc
Add your port to the table above, link to your repo.

---

## 🚫 Anti-Patterns (Was NICHT zu tun ist)

### ❌ Using the same port for multiple backends
```xml
<!-- WRONG: com.sinator.backend AND com.sinator.heypiggy both on :8000 -->
<!-- Will cause "address already in use" errors and silent kills -->
```

### ❌ Hardcoding Fireworks-specific shapes in Dashboard
```typescript
// WRONG
const stats = await fetch("http://localhost:8000/api/v1/pool/stats")
// RIGHT
const stats = await provider.adapter.getPoolStats()
```

### ❌ Returning different response shapes per provider
```json
// WRONG: HeyPiggy returns {accounts: [...]}, Fireworks returns {keys: [...]}
// RIGHT: Both return {keys: [...]} (or {accounts: [...]} as `keys` field)
```

### ❌ Skipping the standard /health endpoint
```python
# WRONG: only exposing /api/v1/health
# RIGHT: expose /health at root with the standard shape
```

---

## ✅ Quick Validation (für neue Rotators)

Run these 3 checks before claiming a Rotator works:

```bash
# 1. Health check returns standard shape
curl -s http://localhost:81XX/health | jq '{status, rotator, version, chrome, cua}'

# 2. Pool stats returns standard shape
curl -s http://localhost:81XX/api/v1/pool/stats | jq '{total, used, suspended, leased, available, key_count: (.keys | length)}'

# 3. Pool lease works
curl -s "http://localhost:81XX/api/v1/pool-lease?leased_to=test" | jq '{status, api_key, alias_email}'
```

All three must succeed. If any returns 404 or wrong shape, the Rotator is NOT
ready for the Dashboard.

---

*Last updated: 2026-06-02 — added after HeyPiggy/Fireworks integration fix*
