// API client for SINator FastAPI backend (proxied via Next.js rewrites to localhost:8000)
// Endpoints sind provider-spezifisch via apiPrefix.

export interface PoolKey {
  id: string
  alias_email: string
  key_name: string
  created_at: string
  used: boolean
  status?: "active" | "unused" | "suspended"
}

export interface PoolStats {
  status: string
  total: number
  used: number
  available: number
  keys: PoolKey[]
  execution_time?: string
}

export interface Health {
  status: string
  browser_running: boolean
  cdp_port: number | null
  gmx_alias_api: string
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
  api_key?: string
  api_key_name?: string
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

// Globale Endpoints (nicht provider-spezifisch)
export async function getHealth(): Promise<Health> {
  const r = await fetch("/health", { cache: "no-store" })
  return handleJson<Health>(r)
}

export async function getBrowserStatus(): Promise<BrowserStatus> {
  const r = await fetch("/api/v1/browser/status", { cache: "no-store" })
  return handleJson<BrowserStatus>(r)
}

// Provider-spezifische Endpoints
export async function getPoolStats(apiPrefix: string): Promise<PoolStats> {
  const r = await fetch(`${apiPrefix}/pool/stats`, { cache: "no-store" })
  return handleJson<PoolStats>(r)
}

export async function startRotation(apiPrefix: string, password: string): Promise<RotationResult> {
  const r = await fetch(`${apiPrefix}/rotation/full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fireworks_password: password, save_to_pool: true }),
  })
  return handleJson<RotationResult>(r)
}

export async function markKeyUsed(apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await fetch(`${apiPrefix}/pool/use?key_id=${encodeURIComponent(keyId)}`, {
    method: "POST",
  })
  return handleJson(r)
}

export async function deleteKey(apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await fetch(`${apiPrefix}/pool/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  })
  return handleJson(r)
}

export async function addKey(
  apiPrefix: string,
  payload: Record<string, unknown>,
): Promise<{ status: string }> {
  const r = await fetch(`${apiPrefix}/pool/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleJson(r)
}
