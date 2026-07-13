"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Zap,
  RefreshCw,
  Activity,
  Snowflake,
  CheckCircle2,
  Timer,
  TrendingUp,
  Server,
} from "lucide-react"
import {
  getFreeModelPoolStatus,
  getFreeModelHealth,
  type FreeModelPoolStatus,
} from "@/lib/api"

interface FreeModelPoolStatsProps {
  backendUrl: string
}

function formatCooldown(ms: number): string {
  if (ms <= 0) return "bereit"
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "gerade eben"
  const min = Math.floor(sec / 60)
  if (min < 60) return `vor ${min}m`
  const h = Math.floor(min / 60)
  return `vor ${h}h`
}

export function FreeModelPoolStats({ backendUrl }: FreeModelPoolStatsProps) {
  const [status, setStatus] = React.useState<FreeModelPoolStatus | null>(null)
  const [healthy, setHealthy] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [, forceTick] = React.useReducer((x: number) => x + 1, 0)

  const refresh = React.useCallback(async () => {
    try {
      const [h, s] = await Promise.allSettled([
        getFreeModelHealth(backendUrl),
        getFreeModelPoolStatus(backendUrl),
      ])
      setHealthy(h.status === "fulfilled")
      if (s.status === "fulfilled") {
        setStatus(s.value)
        setError(null)
      } else {
        setError("Pool nicht erreichbar")
      }
    } finally {
      setLoading(false)
    }
  }, [backendUrl])

  React.useEffect(() => {
    refresh()
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [refresh])

  // Live countdown tick every second
  React.useEffect(() => {
    const id = setInterval(() => forceTick(), 1000)
    return () => clearInterval(id)
  }, [])

  const active = status?.active ?? 0
  const total = status?.total ?? 0
  const cooling = total - active
  const totalRequests = status?.keys?.reduce((sum, k) => sum + k.requests, 0) ?? 0
  const totalInUse = status?.keys?.reduce((sum, k) => sum + k.in_use, 0) ?? 0
  const activePct = total > 0 ? (active / total) * 100 : 0

  if (loading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <RefreshCw className="size-5 animate-spin mx-auto mb-2" />
        Lade FreeModel Pool…
      </Card>
    )
  }

  if (error && !status) {
    return (
      <Card className="p-8 text-center">
        <Server className="size-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <p className="text-xs text-muted-foreground">
          Pool starten: <code className="bg-muted px-1.5 py-0.5 rounded">launchctl start dev.sinrotator.freemodel-pool</code>
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={refresh}>
          <RefreshCw className="size-3.5 mr-1" /> Erneut versuchen
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Health indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`size-2.5 rounded-full ${healthy ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm font-medium">
            FreeModel Pool {healthy ? "online" : "offline"}
          </span>
          <Badge variant="secondary" className="text-xs">localhost:8787</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="size-3.5 text-cyan-500" />
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </Card>
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{active}</p>
          </div>
        </Card>
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <Snowflake className="size-3.5 text-amber-500" />
              <p className="text-xs text-muted-foreground">Cooling</p>
            </div>
            <p className="text-2xl font-bold text-amber-500">{cooling}</p>
          </div>
        </Card>
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5 text-blue-500" />
              <p className="text-xs text-muted-foreground">Requests</p>
            </div>
            <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Animated progress bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Key-Verfügbarkeit</span>
          <span className="text-xs font-bold">{active}/{total} aktiv</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700 ease-out relative"
            style={{ width: `${activePct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
          {cooling > 0 && (
            <div
              className="absolute top-0 h-full bg-amber-500/40 transition-all duration-700"
              style={{ left: `${activePct}%`, width: `${100 - activePct}%` }}
            />
          )}
        </div>
        {totalInUse > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Activity className="size-3 text-cyan-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">{totalInUse} Key{totalInUse > 1 ? "s" : ""} in Verwendung</span>
          </div>
        )}
      </Card>

      {/* Key table */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="size-4 text-cyan-500" />
          <h3 className="font-semibold">Live Key-Status</h3>
          <Badge variant="secondary" className="text-xs ml-auto">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
            Live (2s)
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Cooldown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status?.keys?.map((k, i) => {
                const isActive = k.status === "active"
                const inUse = k.in_use > 0
                return (
                  <TableRow key={i} className={isActive ? "" : "opacity-75"}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <Snowflake className="size-4 text-amber-500" />
                        )}
                        {inUse && (
                          <div className="size-2 rounded-full bg-cyan-500 animate-pulse" title="in use" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {k.key}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {k.requests.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isActive ? (
                        <span className="text-xs text-emerald-600 font-medium">bereit</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Timer className="size-3 text-amber-500" />
                          <span className="text-xs font-mono text-amber-600">
                            {formatCooldown(k.cools_in_ms)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {status?.now && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            Stand: {formatTimeAgo(status.now)}
          </p>
        )}
      </Card>
    </div>
  )
}
