// Lokale Key-Historie im Browser (nur Anzeige der zuletzt generierten Keys)
"use client"

const HISTORY_KEY = "sinator.key_history"
const MAX_HISTORY = 5

export interface HistoryEntry {
  api_key: string
  api_key_name?: string
  alias_email?: string
  created_at: string // ISO
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : []
  } catch {
    return []
  }
}

export function addToHistory(entry: HistoryEntry) {
  if (typeof window === "undefined") return
  const current = loadHistory()
  const next = [entry, ...current.filter((e) => e.api_key !== entry.api_key)].slice(0, MAX_HISTORY)
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export function clearHistory() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(HISTORY_KEY)
}

export function maskKey(key: string | undefined | null): string {
  if (!key) return ""
  if (key.length <= 12) return key
  return `${key.slice(0, 6)}…${key.slice(-4)}`
}
