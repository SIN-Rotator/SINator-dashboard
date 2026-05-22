"use client"

import { AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Props {
  available: number
}

export function PoolWarning({ available }: Props) {
  if (available === 0 || available > 2) return null
  return (
    <Card className="p-3 border-amber-500/40 bg-amber-500/5">
      <div className="flex items-center gap-3 text-sm">
        <AlertTriangle className="size-4 text-amber-500 shrink-0" />
        <p className="text-amber-700 dark:text-amber-400">
          Pool wird knapp:{" "}
          <strong className="font-semibold">
            nur noch {available} {available === 1 ? "Key" : "Keys"} verfügbar
          </strong>
          . Zeit, neue zu holen.
        </p>
      </div>
    </Card>
  )
}
