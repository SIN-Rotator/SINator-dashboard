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

function getToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("sinator.auth_token")
}

async function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...((opts.headers as Record<string, string>) || {}),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetch(url, { ...opts, headers })
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
  const r = await apiFetch("/health", { cache: "no-store" })
  return handleJson<Health>(r)
}

export async function getBrowserStatus(): Promise<BrowserStatus> {
  const r = await apiFetch("/api/v1/browser/status", { cache: "no-store" })
  return handleJson<BrowserStatus>(r)
}

// Provider-spezifische Endpoints
export async function getPoolStats(apiPrefix: string): Promise<PoolStats> {
  const r = await apiFetch(`${apiPrefix}/pool/stats`, { cache: "no-store" })
  return handleJson<PoolStats>(r)
}

export async function startRotation(apiPrefix: string, password: string): Promise<RotationResult> {
  const r = await apiFetch(`${apiPrefix}/rotation/full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fireworks_password: password, save_to_pool: true }),
  })
  return handleJson<RotationResult>(r)
}

export async function markKeyUsed(apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await apiFetch(`${apiPrefix}/pool/use?key_id=${encodeURIComponent(keyId)}`, {
    method: "POST",
  })
  return handleJson(r)
}

export async function deleteKey(apiPrefix: string, keyId: string): Promise<{ status: string }> {
  const r = await apiFetch(`${apiPrefix}/pool/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  })
  return handleJson(r)
}

export async function addKey(
  apiPrefix: string,
  payload: Record<string, unknown>,
): Promise<{ status: string }> {
  const r = await apiFetch(`${apiPrefix}/pool/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleJson(r)
}
