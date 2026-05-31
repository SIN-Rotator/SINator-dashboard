"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CircleDot, Loader2, CheckCircle2, Zap, StopCircle } from "lucide-react"
import { startRotation, type RotationResult } from "@/lib/api"
import { useProvider } from "@/components/provider-context"
import { toast } from "sonner"

type Status = "idle" | "running" | "done" | "error"

export interface LogEntry {
  ts: string
  message: string
  status: "ok" | "err" | "info"
  duration?: string
}

interface Props {
  onLog: (entry: LogEntry) => void
  onRotationDone: () => void
}

function StatusPill({ status }: { status: Status }) {
  if (status === "running")
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
        <Loader2 className="size-3 mr-1.5 animate-spin" />
        Running
      </Badge>
    )
  if (status === "done")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
        <CheckCircle2 className="size-3 mr-1.5" />
        Done
      </Badge>
    )
  if (status === "error") return <Badge variant="destructive">Error</Badge>
  return (
    <Badge variant="secondary">
      <CircleDot className="size-3 mr-1.5" />
      Idle
    </Badge>
  )
}

export function RotationPanel({ onLog, onRotationDone }: Props) {
  const { provider } = useProvider()
  const [status, setStatus] = React.useState<Status>("idle")
  const [password, setPassword] = React.useState("")
  const [lastRun, setLastRun] = React.useState<{ at: number; name: string } | null>(null)

  // Loop modes
  const [loopMode, setLoopMode] = React.useState<"single" | "interval" | "target">("single")
  const [intervalMin, setIntervalMin] = React.useState(30)
  const [targetCount, setTargetCount] = React.useState(50)
  const [looping, setLooping] = React.useState(false)
  const [nextRunAt, setNextRunAt] = React.useState<number | null>(null)
  const [, setTick] = React.useState(0)
  const loopRef = React.useRef<{ active: boolean }>({ active: false })

  // Tick for "vor X min" display
  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [])

  async function runOne(): Promise<RotationResult | null> {
    if (!password) {
      toast.error("Password required")
      return null
    }
    setStatus("running")
    const startTs = new Date().toLocaleTimeString()
    onLog({ ts: startTs, message: "Starting rotation pipeline…", status: "info" })
    try {
      const res = await startRotation(provider.backendUrl, provider.poolPrefix, password)
      const endTs = new Date().toLocaleTimeString()
      const completed = res.steps_completed ?? []
      const failed = res.steps_failed ?? []
      for (const step of completed) {
        onLog({ ts: endTs, message: step.replace(/_/g, " "), status: "ok" })
      }
      for (const step of failed) {
        onLog({ ts: endTs, message: step.replace(/_/g, " "), status: "err" })
      }
      if (res.status === "success") {
        onLog({
          ts: endTs,
          message: `🎉 DONE — ${res.api_key_name ?? "key"}`,
          status: "ok",
          duration: res.execution_time,
        })
        setStatus("done")
        setLastRun({ at: Date.now(), name: res.api_key_name ?? "unknown" })
        onRotationDone()
      } else {
        onLog({ ts: endTs, message: res.error ?? "Rotation failed", status: "err" })
        setStatus("error")
      }
      return res
    } catch (e) {
      const msg = (e as Error).message
      onLog({ ts: new Date().toLocaleTimeString(), message: msg, status: "err" })
      setStatus("error")
      return null
    }
  }

  async function startSingle() {
    await runOne()
  }

  async function startLoop() {
    if (!password) {
      toast.error("Password required")
      return
    }
    setLooping(true)
    loopRef.current.active = true

    while (loopRef.current.active) {
      // Check target if applicable. Target check happens before each run.
      if (loopMode === "target") {
        try {
          const r = await fetch(`${provider.poolPrefix}/pool/stats`, { cache: "no-store" })
          const s = await r.json()
          if ((s.total ?? 0) >= targetCount) {
            onLog({
              ts: new Date().toLocaleTimeString(),
              message: `Target reached (${s.total}/${targetCount}) — stopping loop`,
              status: "info",
            })
            break
          }
        } catch {
          // ignore, continue
        }
      }

      await runOne()
      if (!loopRef.current.active) break

      if (loopMode === "interval") {
        const wait = intervalMin * 60 * 1000
        const next = Date.now() + wait
        setNextRunAt(next)
        onLog({
          ts: new Date().toLocaleTimeString(),
          message: `Waiting ${intervalMin}min until next run…`,
          status: "info",
        })
        const stepMs = 1000
        for (let waited = 0; waited < wait && loopRef.current.active; waited += stepMs) {
          await new Promise((r) => setTimeout(r, stepMs))
        }
        setNextRunAt(null)
      } else if (loopMode === "target") {
        // Loop again immediately
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    setLooping(false)
    loopRef.current.active = false
  }

  function stopLoop() {
    loopRef.current.active = false
    setLooping(false)
    setNextRunAt(null)
    onLog({ ts: new Date().toLocaleTimeString(), message: "Loop stopped by user", status: "info" })
  }

  function formatAgo(ts: number) {
    const sec = Math.floor((Date.now() - ts) / 1000)
    if (sec < 60) return `vor ${sec}s`
    const min = Math.floor(sec / 60)
    if (min < 60) return `vor ${min}min`
    return `vor ${Math.floor(min / 60)}h`
  }
  function formatIn(ts: number) {
    const sec = Math.floor((ts - Date.now()) / 1000)
    if (sec <= 0) return "jetzt"
    if (sec < 60) return `in ${sec}s`
    return `in ${Math.floor(sec / 60)}min`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Rotation Control</CardTitle>
        <StatusPill status={status} />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 max-w-md">
          <Label htmlFor="rot-pw">{provider.passwordLabel}</Label>
          <Input
            id="rot-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`${provider.passwordLabel} eingeben`}
            disabled={status === "running" || looping}
          />
        </div>

        <Tabs value={loopMode} onValueChange={(v) => setLoopMode(v as typeof loopMode)}>
          <TabsList>
            <TabsTrigger value="single" disabled={looping}>
              Single
            </TabsTrigger>
            <TabsTrigger value="interval" disabled={looping}>
              Interval
            </TabsTrigger>
            <TabsTrigger value="target" disabled={looping}>
              Target Count
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="pt-4">
            <Button onClick={startSingle} disabled={status === "running" || !password}>
              <Zap className="size-4" />
              Start Single Rotation
            </Button>
          </TabsContent>

          <TabsContent value="interval" className="pt-4 space-y-4">
            <div className="flex items-end gap-3">
              <div className="grid gap-2">
                <Label htmlFor="iv">Every (minutes)</Label>
                <Input
                  id="iv"
                  type="number"
                  min={1}
                  className="w-32"
                  value={intervalMin}
                  onChange={(e) => setIntervalMin(Math.max(1, Number(e.target.value) || 1))}
                  disabled={looping}
                />
              </div>
              {!looping ? (
                <Button onClick={startLoop} disabled={!password}>
                  <Zap className="size-4" />
                  Start Loop
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopLoop}>
                  <StopCircle className="size-4" />
                  Stop Loop
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="target" className="pt-4 space-y-4">
            <div className="flex items-end gap-3">
              <div className="grid gap-2">
                <Label htmlFor="tc">Until pool reaches</Label>
                <Input
                  id="tc"
                  type="number"
                  min={1}
                  className="w-32"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value) || 1))}
                  disabled={looping}
                />
              </div>
              {!looping ? (
                <Button onClick={startLoop} disabled={!password}>
                  <Zap className="size-4" />
                  Start Loop
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopLoop}>
                  <StopCircle className="size-4" />
                  Stop Loop
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
              Letzter Run
            </p>
            <p className="font-mono">
              {lastRun ? `${formatAgo(lastRun.at)} — ${lastRun.name}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
              Nächster Run
            </p>
            <p className="font-mono">{nextRunAt ? formatIn(nextRunAt) : "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
