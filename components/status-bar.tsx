"use client"

import * as React from "react"
import type { Health, PoolStats } from "@/lib/api"
import { ChevronUp, ChevronDown, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface Props {
  health: Health | null
  stats: PoolStats | null
  connected: boolean
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`size-2 rounded-full ${
        ok ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-destructive"
      }`}
    />
  )
}

const START_CMD = "python agent_toolbox/start_toolbox.py"

export function StatusBar({ health, stats, connected }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  async function copyCmd() {
    try {
      await navigator.clipboard.writeText(START_CMD)
      setCopied(true)
      toast.success("Befehl kopiert")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopieren fehlgeschlagen")
    }
  }

  if (!connected) {
    return (
      <div className="fixed bottom-0 inset-x-0 border-t bg-destructive/10 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Dot ok={false} />
            <span className="text-destructive font-semibold">Backend ist offline</span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-muted-foreground text-xs sm:text-sm shrink-0">
              Server starten:
            </span>
            <code className="font-mono px-1.5 py-0.5 rounded bg-background border text-xs truncate">
              {START_CMD}
            </code>
            <button
              onClick={copyCmd}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Befehl kopieren"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <a
            href="https://github.com/SIN-Rotator/SINator-dashboard#readme"
            target="_blank"
            rel="noreferrer"
            className="text-xs underline text-muted-foreground hover:text-foreground shrink-0"
          >
            README
          </a>
        </div>
      </div>
    )
  }

  const allOk = health?.server === "ok" && (stats?.total ?? 0) >= 0

  return (
    <div className="fixed bottom-0 inset-x-0 border-t bg-card/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2 text-sm">
            <Dot ok={allOk} />
            <span className="font-medium">{allOk ? "Alles bereit" : "Verbunden"}</span>
            <span className="text-muted-foreground text-xs">
              · {stats?.total ?? 0} Keys im Pool
            </span>
          </div>
          <span className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </span>
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Dot ok />
              <span className="text-muted-foreground">Chrome:</span>
              <span>Playwright V15.4</span>
            </div>
            <div className="flex items-center gap-2">
              <Dot ok={health?.server === "ok"} />
              <span className="text-muted-foreground">Server:</span>
              <span>v{health?.version ?? "?"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dot ok={(stats?.total ?? 0) > 0} />
              <span className="text-muted-foreground">Pool:</span>
              <span>{stats?.total ?? 0} keys</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
