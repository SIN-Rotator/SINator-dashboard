"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { loadHistory, clearHistory, maskKey, type HistoryEntry } from "@/lib/key-history"

interface Props {
  refreshKey: number
}

export function KeyHistoryCard({ refreshKey }: Props) {
  const [items, setItems] = React.useState<HistoryEntry[]>([])
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null)

  React.useEffect(() => {
    setItems(loadHistory())
  }, [refreshKey])

  if (items.length === 0) return null

  async function copy(key: string, idx: number) {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedIdx(idx)
      toast.success("Kopiert")
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {
      toast.error("Kopieren fehlgeschlagen")
    }
  }

  function clearAll() {
    clearHistory()
    setItems([])
    toast.success("Verlauf gelöscht")
  }

  function relTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "gerade eben"
    if (mins < 60) return `vor ${mins} Min.`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `vor ${hrs} Std.`
    const days = Math.floor(hrs / 24)
    return `vor ${days} Tag${days === 1 ? "" : "en"}`
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Zuletzt erstellt</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground">
          <Trash2 className="size-3" />
          Verlauf löschen
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((entry, idx) => (
          <li
            key={entry.api_key}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border bg-background/50"
          >
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono">{maskKey(entry.api_key)}</code>
              <p className="text-xs text-muted-foreground mt-0.5">
                {relTime(entry.created_at)}
                {entry.api_key_name && ` · ${entry.api_key_name}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(entry.api_key, idx)}
              className="h-8 shrink-0"
            >
              {copiedIdx === idx ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3">
        Nur lokal in deinem Browser gespeichert.
      </p>
    </Card>
  )
}
