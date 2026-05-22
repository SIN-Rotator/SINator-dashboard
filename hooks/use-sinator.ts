"use client"

import * as React from "react"
import {
  getBrowserStatus,
  getHealth,
  getPoolStats,
  type BrowserStatus,
  type Health,
  type PoolStats,
} from "@/lib/api"
import { useProvider } from "@/components/provider-context"

interface SinatorState {
  health: Health | null
  browser: BrowserStatus | null
  stats: PoolStats | null
  connected: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function useSinator(pollMs = 10000): SinatorState {
  const { provider } = useProvider()
  const [health, setHealth] = React.useState<Health | null>(null)
  const [browser, setBrowser] = React.useState<BrowserStatus | null>(null)
  const [stats, setStats] = React.useState<PoolStats | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const apiPrefix = provider.apiPrefix

  const refresh = React.useCallback(async () => {
    try {
      const [h, b, s] = await Promise.allSettled([
        getHealth(),
        getBrowserStatus(),
        getPoolStats(apiPrefix),
      ])
      if (h.status === "fulfilled") setHealth(h.value)
      if (b.status === "fulfilled") setBrowser(b.value)
      if (s.status === "fulfilled") setStats(s.value)
      else setStats(null)
      const anyOk =
        h.status === "fulfilled" || b.status === "fulfilled" || s.status === "fulfilled"
      setConnected(anyOk)
    } finally {
      setLoading(false)
    }
  }, [apiPrefix])

  // Reset auf Provider-Wechsel und neu laden
  React.useEffect(() => {
    setStats(null)
    setLoading(true)
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { health, browser, stats, connected, loading, refresh }
}
