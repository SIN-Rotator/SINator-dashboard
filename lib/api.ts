/**
 * Provider-Adapter: maps standard UI operations to provider-specific endpoints.
 *
 * Docs: docs/PROVIDER_API_CONVENTION.md
 *
 * Every Rotator-Backend implements the SAME standard API (see convention doc).
 * The adapter wraps a ProviderConfig and exposes standard methods that the UI
 * calls. The adapter knows HOW to call each provider's specific endpoints
 * (URL, auth, response-shape quirks).
 *
 * UI code should ALWAYS go through an adapter — never call
 * `${provider.backendUrl}/api/v1/pool/stats` directly, use `adapter.getPoolStats()`.
 *
 * This makes adding a new provider as simple as:
 *   1. Implement standard API in the new Rotator's backend
 *   2. Add a ProviderConfig in lib/providers.ts
 *   3. Done — adapter works automatically (default adapter handles all
 *      standard-shape providers).
 */

import type { ProviderConfig } from "./providers"

export interface PoolKey {
  id: string
  alias_email: string
  key_name: string
  created_at: string
  used: boolean
  suspended?: boolean
  suspended_reason?: string
  /** For HeyPiggy-style credentials (email + password, not API keys) */
  email?: string
  password?: string
}

export interface PoolStats {
  status: string
  total: number
  used: number
  suspended: number
  available: number
  /** True for credential pools (HeyPiggy), false for API key pools (Fireworks) */
  hasCredentials?: boolean
  keys: PoolKey[]
  credentials?: PoolKey[]
  execution_time?: string
}

export interface Health {
  /** Standard shape: {status: "ok", rotator: "...", version: "...", chrome: bool, cua: bool} */
  status: string
  version?: string
  rotator?: string
  chrome?: boolean
  cua?: boolean
}

export interface LeasedItem {
  status: string
  /** API key value (Fireworks: fw_xxx) — for API key pools */
  api_key?: string
  /** Email (HeyPiggy-style credentials) */
  email?: string
  /** Password (HeyPiggy-style credentials) */
  password?: string
  /** Item name (key_name or credential name) */
  key_name?: string
  /** Item ID */
  key_id?: string
  /** Alias email associated with the item */
  alias_email?: string
}

export interface RotationResult {
  status: string
  /** GMX email alias used (e.g. "xxx@gmx.de") */
  gmx_alias?: string
  /** Account identifier (usually same as gmx_alias) */
  fireworks_account?: string
  heypiggy_account?: string
  /** Generated API key (for API key pools) */
  api_key?: string
  /** Generated credential (for credential pools) */
  credential_id?: string
  api_key_name?: string
  steps_completed: string[]
  steps_failed: string[]
  execution_time?: string
  error?: string
}

/**
 * Auth token for backend APIs. Loaded from Tauri secure storage at app
 * startup. Empty string = no auth (for dev backends without SINATOR_AUTH_TOKEN).
 */
let AUTH_TOKEN: string = ""

/** Set the auth token. Call once at app startup after loading from Tauri. */
export function setAuthToken(token: string): void {
  AUTH_TOKEN = token
}

/** Get the current auth token. */
export function getAuthToken(): string {
  return AUTH_TOKEN
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (AUTH_TOKEN) h["Authorization"] = `Bearer ${AUTH_TOKEN}`
  return h
}

async function handleJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text().catch(() => r.statusText)
    throw new Error(`${r.status}: ${text}`)
  }
  return r.json() as Promise<T>
}

/**
 * Standard adapter — works for any provider that implements the convention.
 * If a provider has a non-standard endpoint, create a custom adapter by
 * extending this class.
 */
export class StandardProviderAdapter {
  constructor(public readonly provider: ProviderConfig) {}

  /** GET /health — liveness check. Returns the raw response. */
  async getHealth(): Promise<Health> {
    const r = await fetch(`${this.provider.backendUrl}/health`, {
      cache: "no-store",
      headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
    })
    return handleJson<Health>(r)
  }

  /** GET {poolPrefix}/pool/stats */
  async getPoolStats(): Promise<PoolStats> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool/stats`,
      { cache: "no-store", headers: authHeaders() },
    )
    return handleJson<PoolStats>(r)
  }

  /**
   * GET {poolPrefix}/pool-lease
   * Atomically lease one item from the pool. Throws if pool is empty.
   */
  async leaseItem(leasedTo?: string): Promise<LeasedItem> {
    const params = leasedTo ? `?leased_to=${encodeURIComponent(leasedTo)}` : ""
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool-lease${params}`,
      { cache: "no-store", headers: authHeaders() },
    )
    if (r.status === 404) {
      throw new Error("Pool ist leer — generiere erst neue Items")
    }
    return handleJson<LeasedItem>(r)
  }

  /**
   * POST {apiPrefix}/rotation/full
   * Trigger a fresh rotation. Body shape is the standard convention.
   */
  async rotateItem(password?: string): Promise<RotationResult> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.apiPrefix}/rotation/full`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          // Convention: each provider looks for its own password field
          fireworks_password: password,
          heypiggy_password: password,
          github_password: password,
          vercel_password: password,
          save_to_pool: true,
        }),
      },
    )
    return handleJson<RotationResult>(r)
  }

  /** POST {poolPrefix}/pool/return — give a leased item back. */
  async returnItem(keyId: string, leaseId?: string): Promise<{ status: string }> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool/return`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ key_id: keyId, lease_id: leaseId }),
      },
    )
    return handleJson<{ status: string }>(r)
  }

  /** POST {poolPrefix}/pool/use?key_id=... — mark as used. */
  async markUsed(keyId: string): Promise<{ status: string }> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool/use?key_id=${encodeURIComponent(keyId)}`,
      { method: "POST", headers: authHeaders() },
    )
    return handleJson<{ status: string }>(r)
  }

  /** DELETE {poolPrefix}/pool/credential/{key_id} — delete item from pool. */
  async deleteItem(keyId: string): Promise<{ status: string }> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool/credential/${encodeURIComponent(keyId)}`,
      { method: "DELETE", headers: authHeaders() },
    )
    return handleJson<{ status: string }>(r)
  }

  /** GET {poolPrefix}/pool/reveal/{key_id} — reveal the full secret. */
  async revealItem(keyId: string): Promise<LeasedItem> {
    const r = await fetch(
      `${this.provider.backendUrl}${this.provider.poolPrefix}/pool/reveal/${encodeURIComponent(keyId)}`,
      { cache: "no-store", headers: authHeaders() },
    )
    return handleJson<LeasedItem>(r)
  }
}

/**
 * Custom adapter for credential-based providers (HeyPiggy-style).
 * Pool items are email+password tuples, not API keys. The list view should
 * show "Email + Passwort" instead of "API Key".
 */
export class CredentialProviderAdapter extends StandardProviderAdapter {
  override async leaseItem(leasedTo?: string): Promise<LeasedItem> {
    const item = await super.leaseItem(leasedTo)
    // Credential pools may return {email, password} instead of {api_key}
    return item
  }
}

/**
 * Factory: get the right adapter for a provider.
 * Add new adapter types here when a provider needs custom behavior.
 */
export function getProviderAdapter(provider: ProviderConfig): StandardProviderAdapter {
  if (!provider.capabilities.hasApiKeys) {
    // Credential pool (HeyPiggy, future: email-only providers)
    return new CredentialProviderAdapter(provider)
  }
  // Default: standard API key pool
  return new StandardProviderAdapter(provider)
}

// ═══════════════════════════════════════════════════════════════════════════
// Backward-compat shims — used by older UI code that imported these from
// lib/api.ts. New code should use getProviderAdapter() instead.
// ═══════════════════════════════════════════════════════════════════════════

import {
  getProviderHealthUrl,
  getProviderStatsUrl,
  getProviderLeaseUrl,
} from "./providers"

export function apiUrl(backendUrl: string, path: string): string {
  return `${backendUrl}${path}`
}

export async function getHealth(backendUrl: string): Promise<Health> {
  const r = await fetch(apiUrl(backendUrl, "/health"), {
    cache: "no-store",
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
  })
  return handleJson<Health>(r)
}

export async function getPoolStats(backendUrl: string, apiPrefix: string): Promise<PoolStats> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/stats`), {
    cache: "no-store",
    headers: authHeaders(),
  })
  return handleJson<PoolStats>(r)
}

export async function startRotation(
  backendUrl: string,
  apiPrefix: string,
  password: string,
): Promise<RotationResult> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/rotation/full`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fireworks_password: password, heypiggy_password: password, save_to_pool: true }),
  })
  return handleJson<RotationResult>(r)
}

export async function markKeyUsed(backendUrl: string, apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/use?key_id=${encodeURIComponent(keyId)}`), {
    method: "POST",
    headers: authHeaders(),
  })
  return handleJson(r)
}

export async function deleteKey(backendUrl: string, apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/credential/${encodeURIComponent(keyId)}`), {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleJson(r)
}

export async function revealKey(backendUrl: string, apiPrefix: string, keyId: string): Promise<{ status: string; api_key: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/reveal/${encodeURIComponent(keyId)}`), {
    cache: "no-store",
    headers: authHeaders(),
  })
  return handleJson(r)
}

export async function addKey(
  backendUrl: string,
  apiPrefix: string,
  payload: Record<string, unknown>,
): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/add`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleJson(r)
}

export interface ConfigData {
  gmx_email: string
  gmx_password: string
  fireworks_password: string
}

// === Vercel Pool API (SINator-VercelPool specific) ===

export interface VercelPoolKey {
  key: string
  added_at: string
  last_used: string | null
  cooldown_until: string | null
  use_count: number
  error_count: number
  status: "active" | "cooldown" | "exhausted"
}

export interface VercelPoolStats {
  total_keys: number
  active_keys: number
  cooldown_keys: number
  total_requests: number
  successful_requests: number
  failed_requests: number
  keys: VercelPoolKey[]
}

export interface VercelPoolHealth {
  status: string
  pool_size: number
  active_keys: number
  cooldown_keys: number
  uptime_seconds: number
}

export async function getVercelPoolHealth(backendUrl: string): Promise<VercelPoolHealth> {
  const r = await fetch(apiUrl(backendUrl, "/health"), { cache: "no-store" })
  return handleJson<VercelPoolHealth>(r)
}

export async function getVercelPoolStats(backendUrl: string): Promise<VercelPoolStats> {
  const r = await fetch(apiUrl(backendUrl, "/pool/stats"), { cache: "no-store" })
  return handleJson<VercelPoolStats>(r)
}

export async function addVercelPoolKeys(backendUrl: string, keys: string[]): Promise<{ status: string; added: number }> {
  const r = await fetch(apiUrl(backendUrl, "/pool/keys"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  })
  return handleJson(r)
}

export async function removeVercelPoolKey(backendUrl: string, keyPrefix: string): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `/pool/keys/${encodeURIComponent(keyPrefix)}`), {
    method: "DELETE",
  })
  return handleJson(r)
}

export async function resetVercelPoolKey(backendUrl: string, keyPrefix: string): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `/pool/keys/${encodeURIComponent(keyPrefix)}/reset`), {
    method: "POST",
  })
  return handleJson(r)
}

export async function getConfig(apiPrefix: string, backendUrl?: string): Promise<ConfigData> {
  const r = await fetch(apiUrl(backendUrl || "http://localhost:8100", `${apiPrefix}/config`), {
    cache: "no-store",
  })
  return handleJson(r) as Promise<ConfigData>
}

// === FreeModel Pool API (localhost:8787) ===

export interface FreeModelKey {
  key: string
  requests: number
  tokens: number
  in_use: number
  status: "active" | "cooling"
  cool_until: string | null
  cools_in_ms: number
}

export interface FreeModelPoolStatus {
  now: string
  keys: FreeModelKey[]
  active: number
  total: number
}

export interface FreeModelHealth {
  status: string
}

export async function getFreeModelHealth(backendUrl: string): Promise<FreeModelHealth> {
  const r = await fetch(`${backendUrl}/healthz`, { cache: "no-store" })
  if (!r.ok) throw new Error(`${r.status}`)
  return { status: "ok" }
}

export async function getFreeModelPoolStatus(backendUrl: string): Promise<FreeModelPoolStatus> {
  const r = await fetch(`${backendUrl}/pool/status`, { cache: "no-store" })
  return handleJson<FreeModelPoolStatus>(r)
}

export async function saveConfig(
  apiPrefix: string,
  data: { gmx_email: string; gmx_password: string; fireworks_password: string },
  backendUrl?: string,
): Promise<ConfigData> {
  const r = await fetch(apiUrl(backendUrl || "http://localhost:8100", `${apiPrefix}/config`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleJson(r) as Promise<ConfigData>
}
