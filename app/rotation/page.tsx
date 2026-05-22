"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { StatusBar } from "@/components/status-bar"
import { RotationPanel, type LogEntry } from "@/components/rotation-panel"
import { LiveLog } from "@/components/live-log"
import { useSinator } from "@/hooks/use-sinator"

export default function RotationPage() {
  const { health, browser, stats, connected, refresh } = useSinator()
  const [logs, setLogs] = React.useState<LogEntry[]>([])

  function addLog(e: LogEntry) {
    setLogs((prev) => [...prev.slice(-200), e])
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rotation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run single or looped key rotations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <RotationPanel onLog={addLog} onRotationDone={refresh} />
          <LiveLog entries={logs} onClear={() => setLogs([])} />
        </div>
      </main>
      <StatusBar health={health} browser={browser} stats={stats} connected={connected} />
    </div>
  )
}
