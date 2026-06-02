"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Triangle
} from "lucide-react"
import {
  getVercelPoolStats,
  addVercelPoolKeys,
  removeVercelPoolKey,
  resetVercelPoolKey,
  type VercelPoolStats,
  type VercelPoolKey,
} from "@/lib/api"

interface VercelPoolStatsProps {
  backendUrl: string
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: VercelPoolKey["status"] }) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="border-emerald-500 text-emerald-500">
          <CheckCircle2 className="size-3 mr-1" />
          Aktiv
        </Badge>
      )
    case "cooldown":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          <Clock className="size-3 mr-1" />
          Cooldown
        </Badge>
      )
    case "exhausted":
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          <XCircle className="size-3 mr-1" />
          Erschöpft
        </Badge>
      )
  }
}

export function VercelPoolStats({ backendUrl }: VercelPoolStatsProps) {
  const [stats, setStats] = React.useState<VercelPoolStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [newKeys, setNewKeys] = React.useState("")
  const [adding, setAdding] = React.useState(false)

  const fetchStats = React.useCallback(async () => {
    try {
      const data = await getVercelPoolStats(backendUrl)
      setStats(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindungsfehler")
    } finally {
      setLoading(false)
    }
  }, [backendUrl])

  React.useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  async function handleAddKeys() {
    const keys = newKeys
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
    
    if (keys.length === 0) return
    
    setAdding(true)
    try {
      await addVercelPoolKeys(backendUrl, keys)
      setNewKeys("")
      setAddDialogOpen(false)
      await fetchStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Hinzufügen")
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveKey(keyPrefix: string) {
    try {
      await removeVercelPoolKey(backendUrl, keyPrefix)
      await fetchStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Entfernen")
    }
  }

  async function handleResetKey(keyPrefix: string) {
    try {
      await resetVercelPoolKey(backendUrl, keyPrefix)
      await fetchStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Reset")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Lade Pool-Status...
        </div>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <p className="text-destructive">{error || "Pool nicht erreichbar"}</p>
          <p className="text-sm text-muted-foreground">
            Stelle sicher, dass SINator-VercelPool auf {backendUrl} läuft
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="size-3.5 mr-1" />
            Erneut versuchen
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total_keys}</p>
          <p className="text-xs text-muted-foreground mt-1">Gesamt Keys</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{stats.active_keys}</p>
          <p className="text-xs text-muted-foreground mt-1">Aktiv</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{stats.cooldown_keys}</p>
          <p className="text-xs text-muted-foreground mt-1">Cooldown</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.successful_requests}</p>
          <p className="text-xs text-muted-foreground mt-1">Erfolgreiche Requests</p>
        </Card>
      </div>

      {/* Key Table */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Triangle className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">AI Gateway Keys</h3>
          </div>
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="size-3.5" />
                  Key hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Gateway Keys hinzufügen</DialogTitle>
                  <DialogDescription>
                    Füge einen oder mehrere AI_GATEWAY_API_KEYs hinzu (durch Komma oder Zeilenumbruch getrennt)
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="sk-ant-... oder mehrere Keys"
                  value={newKeys}
                  onChange={(e) => setNewKeys(e.target.value)}
                  className="font-mono text-sm"
                />
                <DialogFooter>
                  <Button onClick={handleAddKeys} disabled={adding || !newKeys.trim()}>
                    {adding ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Hinzufügen...
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" />
                        Hinzufügen
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {stats.keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Noch keine Keys im Pool</p>
            <p className="text-sm mt-1">Füge deinen ersten AI_GATEWAY_API_KEY hinzu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Nutzungen</TableHead>
                  <TableHead>Zuletzt</TableHead>
                  <TableHead>Cooldown bis</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.keys.map((key) => (
                  <TableRow key={key.key.slice(0, 8)}>
                    <TableCell className="font-mono text-sm">
                      {maskKey(key.key)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={key.status} />
                    </TableCell>
                    <TableCell className="text-right">{key.use_count}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(key.last_used)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {key.cooldown_until ? formatDate(key.cooldown_until) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {key.status === "cooldown" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetKey(key.key.slice(0, 8))}
                            title="Cooldown zurücksetzen"
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKey(key.key.slice(0, 8))}
                          title="Key entfernen"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
