// API client for SINator FastAPI backends
// Each provider can have its own backendUrl (e.g. HeyPiggy on :8001)

export function apiUrl(backendUrl: string, path: string): string {
  return `${backendUrl}${path}`
}

export interface PoolKey {
  id: string
  alias_email: string
  key_name: string
  created_at: string
  used: boolean
  suspended?: boolean
  suspended_reason?: string
}

export interface PoolCredential {
  id: string
  email: string
  password: string
  alias_email: string
  created_at: string
  used: boolean
  used_at: string | null
}

export interface PoolStats {
  status: string
  total: number
  used: number
  suspended: number
  available: number
  keys: PoolKey[]
  credentials?: PoolCredential[]
  execution_time?: string
}

export interface Health {
  server: string
  chrome: boolean
  cua: boolean
  version?: string
}

export interface BrowserStatus {
  is_running: boolean
  cdp_port: number
  page_count: number
}

export interface RotationResult {
  status: string
  gmx_alias?: string
  fireworks_account?: string
  heypiggy_account?: string
  api_key?: string
  api_key_name?: string
  credential_id?: string
  steps_completed: string[]
  steps_failed: string[]
  execution_time?: string
  error?: string
}

async function handleJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text().catch(() => r.statusText)
    throw new Error(`${r.status}: ${text}`)
  }
  return r.json() as Promise<T>
}

// Globale Endpoints (immer über Fireworks-Backend :8000)
const DEFAULT_BACKEND = "http://localhost:8000"

export async function getHealth(backendUrl?: string): Promise<Health> {
  const r = await fetch(apiUrl(backendUrl || DEFAULT_BACKEND, "/health"), { cache: "no-store" })
  return handleJson<Health>(r)
}

export async function getBrowserStatus(): Promise<BrowserStatus> {
  const r = await fetch(apiUrl(DEFAULT_BACKEND, "/api/v1/browser/status"), { cache: "no-store" })
  return handleJson<BrowserStatus>(r)
}

export async function getPoolStats(backendUrl: string, apiPrefix: string): Promise<PoolStats> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/stats`), { cache: "no-store" })
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
  })
  return handleJson(r)
}

export async function deleteKey(backendUrl: string, apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/credential/${encodeURIComponent(keyId)}`), {
    method: "DELETE",
  })
  return handleJson(r)
}

export async function revealKey(backendUrl: string, apiPrefix: string, keyId: string): Promise<{ status: string; api_key: string }> {
  const r = await fetch(apiUrl(backendUrl, `${apiPrefix}/pool/reveal/${encodeURIComponent(keyId)}`), {
    cache: "no-store",
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

export async function getConfig(apiPrefix: string, backendUrl?: string): Promise<ConfigData> {
  const r = await fetch(apiUrl(backendUrl || DEFAULT_BACKEND, `${apiPrefix}/config`), { cache: "no-store" })
  return handleJson(r) as Promise<ConfigData>
}

export async function saveConfig(
  apiPrefix: string,
  data: { gmx_email: string; gmx_password: string; fireworks_password: string },
  backendUrl?: string,
): Promise<ConfigData> {
  const r = await fetch(apiUrl(backendUrl || DEFAULT_BACKEND, `${apiPrefix}/config`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleJson(r) as Promise<ConfigData>
}
