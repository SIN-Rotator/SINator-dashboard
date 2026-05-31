"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { StatusBar } from "@/components/status-bar"
import { GetKeyHero } from "@/components/get-key-hero"
import { KeyTable } from "@/components/key-table"
import { KeyHistoryCard } from "@/components/key-history-card"
import { PoolWarning } from "@/components/pool-warning"
import { useSinator } from "@/hooks/use-sinator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, Settings2, KeyRound, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const { health, stats, connected, refresh } = useSinator()
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [historyTick, setHistoryTick] = React.useState(0)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const total = stats?.total ?? 0
  const available = stats?.available ?? 0
  const dead = (stats?.used ?? 0) + (stats?.suspended ?? 0)

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
        <PoolWarning available={available} />

        <GetKeyHero
          available={available}
          connected={connected}
          onDone={refresh}
          onHistoryUpdate={() => setHistoryTick((t) => t + 1)}
        />

        <KeyHistoryCard refreshKey={historyTick} />

        {/* Friendly stats summary */}
        {connected && total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground mt-1">Gesamt</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{available}</p>
              <p className="text-xs text-muted-foreground mt-1">Verfügbar</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{dead}</p>
              <p className="text-xs text-muted-foreground mt-1">Verbraucht</p>
            </Card>
          </div>
        )}

        {/* Advanced collapsible */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4" />
                Erweitert: Alle Keys verwalten
              </span>
              <ChevronDown
                className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold">Key-Pool</h3>
                </div>
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
              <KeyTable keys={stats?.keys ?? []} onMutate={refresh} />
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Brauchst du Loop-Modus oder Live-Logs?{" "}
              <a href="/rotation" className="underline hover:text-foreground">
                Zur Rotations-Steuerung
              </a>
            </p>
          </CollapsibleContent>
        </Collapsible>
      </main>
      <StatusBar health={health} stats={stats} connected={connected} />
    </div>
  )
}
