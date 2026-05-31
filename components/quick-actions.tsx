"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { startRotation } from "@/lib/api"
import { useProvider } from "@/components/provider-context"

interface Props {
  onRefresh: () => void
  onRotationDone: () => void
  refreshing?: boolean
}

export function QuickActions({ onRefresh, onRotationDone, refreshing }: Props) {
  const { provider } = useProvider()
  const [open, setOpen] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [running, setRunning] = React.useState(false)

  async function runRotation() {
    if (!password) {
      toast.error("Password required")
      return
    }
    setRunning(true)
    setOpen(false)
    const id = toast.loading("Rotation running…", {
      description: "GMX → Fireworks → Key (~200s)",
    })
    try {
      const res = await startRotation(provider.backendUrl, provider.poolPrefix, password)
      if (res.status === "success") {
        toast.success("Rotation complete", {
          id,
          description: `${res.api_key_name ?? "key"} • ${res.execution_time ?? ""}`,
        })
        onRotationDone()
      } else {
        toast.error("Rotation failed", {
          id,
          description: res.error ?? res.steps_failed?.join(", ") ?? "Unknown error",
        })
      }
    } catch (e) {
      toast.error("Rotation error", { id, description: (e as Error).message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)} disabled={running}>
          <Zap className="size-4" />
          {running ? "Rotating…" : "Rotate Now"}
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start full rotation</DialogTitle>
            <DialogDescription>
              Runs GMX alias rotation → Fireworks signup → API key creation. Takes ~200 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="pw">Fireworks password</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Fireworks password"
              onKeyDown={(e) => e.key === "Enter" && runRotation()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runRotation} disabled={!password}>
              <Zap className="size-4" />
              Start Rotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
