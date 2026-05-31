"use client"

import * as React from "react"
import {
  getHealth,
  getPoolStats,
  type Health,
  type PoolStats,
} from "@/lib/api"
import { useProvider } from "@/components/provider-context"

interface SinatorState {
  health: Health | null
  stats: PoolStats | null
  connected: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function useSinator(pollMs = 10000): SinatorState {
  const { provider } = useProvider()
  const [health, setHealth] = React.useState<Health | null>(null)
  const [stats, setStats] = React.useState<PoolStats | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const apiPrefix = provider.poolPrefix
  const backendUrl = provider.backendUrl

  const refresh = React.useCallback(async () => {
    try {
      const [h, s] = await Promise.allSettled([
        getHealth(backendUrl),
        getPoolStats(backendUrl, apiPrefix),
      ])
      if (h.status === "fulfilled") setHealth(h.value)
      if (s.status === "fulfilled") setStats(s.value)
      else setStats(null)
      setConnected(h.status === "fulfilled")
    } finally {
      setLoading(false)
    }
  }, [apiPrefix, backendUrl])

  // Reset auf Provider-Wechsel und neu laden
  React.useEffect(() => {
    setStats(null)
    setLoading(true)
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { health, stats, connected, loading, refresh }
}
