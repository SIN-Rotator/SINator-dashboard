"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface Props {
  open: boolean
  onLogin: (token: string) => void
}

export function LoginDialog({ open, onLogin }: Props) {
  const [token, setToken] = React.useState("")

  function handleSubmit() {
    if (token.trim()) onLogin(token.trim())
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="size-10 mx-auto rounded-xl bg-primary/15 flex items-center justify-center mb-3">
            <Lock className="size-5 text-primary" />
          </div>
          <DialogTitle className="text-center">SINator Login</DialogTitle>
          <DialogDescription className="text-center">
            Gib deinen SINator Auth-Token ein. Den Token findest du in der
            Konsole beim Start des Backends.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Auth Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sinator-xxxxxxxxxxxx"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!token.trim()} className="w-full">
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
