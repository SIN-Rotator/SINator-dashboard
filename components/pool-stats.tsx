"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Database, CheckCircle2, CircleDot } from "lucide-react"
import type { PoolStats as PoolStatsType } from "@/lib/api"

interface Props {
  stats: PoolStatsType | null
  loading?: boolean
}

export function PoolStats({ stats, loading }: Props) {
  const items = [
    {
      label: "Total Keys",
      value: stats?.total ?? 0,
      icon: Database,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Available",
      value: stats?.available ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Used",
      value: stats?.used ?? 0,
      icon: CircleDot,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
                  <p className="text-4xl font-bold mt-2 font-mono tabular-nums">
                    {loading && stats === null ? "—" : item.value}
                  </p>
                </div>
                <div className={`${item.bg} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
