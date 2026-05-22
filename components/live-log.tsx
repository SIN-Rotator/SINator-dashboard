"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { LogEntry } from "./rotation-panel"

interface Props {
  entries: LogEntry[]
  onClear: () => void
}

export function LiveLog({ entries, onClear }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Live Log</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={entries.length === 0}>
          <Trash2 className="size-4" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div
          ref={ref}
          className="bg-muted/40 border rounded-md font-mono text-xs h-80 overflow-y-auto p-3 space-y-1"
        >
          {entries.length === 0 ? (
            <div className="text-muted-foreground italic">No log entries yet…</div>
          ) : (
            entries.map((e, i) => {
              const icon =
                e.status === "ok" ? "✅" : e.status === "err" ? "❌" : "•"
              const color =
                e.status === "ok"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : e.status === "err"
                    ? "text-destructive"
                    : "text-muted-foreground"
              return (
                <div key={i} className="flex gap-3">
                  <span className="text-muted-foreground tabular-nums shrink-0">{e.ts}</span>
                  <span className={`shrink-0 ${color}`}>{icon}</span>
                  <span className="break-all">
                    {e.message}
                    {e.duration && (
                      <span className="text-muted-foreground ml-2">({e.duration})</span>
                    )}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
