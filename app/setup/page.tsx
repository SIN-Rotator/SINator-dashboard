"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Terminal, Download, Globe, Shield } from "lucide-react"
import { toast } from "sonner"

const STEPS = [
  {
    title: "1. Python installieren",
    cmd: "python3 --version",
    desc: "Python 3.11+ benötigt",
    check: true,
  },
  {
    title: "2. Repo klonen",
    cmd: "git clone https://github.com/SIN-Rotator/SINator-FireworksAI ~/sinator",
    desc: "SINator Backend + Tools",
  },
  {
    title: "3. Dependencies",
    cmd: "cd ~/sinator && pip3 install -r requirements.txt",
    desc: "Python packages",
  },
  {
    title: "4. Backend starten",
    cmd: "cd ~/sinator && python3 agent_toolbox/start_toolbox.py",
    desc: "FastAPI auf Port 8000",
  },
  {
    title: "5. Dashboard starten",
    cmd: "cd ~/sinator-dashboard && pnpm dev",
    desc: "Next.js auf Port 3000",
  },
  {
    title: "6. Chrome + CUA",
    cmd: `open -a "Google Chrome" --args --remote-debugging-port=9222 && cua-driver serve &`,
    desc: "Browser + Accessibility",
  },
]

export default function SetupPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="size-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
            <Download className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">SINator installieren</h1>
          <p className="text-base text-muted-foreground">
            Von Null auf fertig in 2 Minuten — alles lokal auf deiner Maschine.
          </p>
        </div>

        {/* One-liner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium mb-2">⚡ One-Liner (macOS):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background border rounded px-3 py-2 font-mono overflow-x-auto">
                curl -fsSL https://raw.githubusercontent.com/SIN-Rotator/SINator-FireworksAI/main/tools/install.sh | bash
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "curl -fsSL https://raw.githubusercontent.com/SIN-Rotator/SINator-FireworksAI/main/tools/install.sh | bash"
                  )
                  toast.success("Kopiert")
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Schritt für Schritt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {step.check && <Check className="size-4 text-emerald-500" />}
                  <h3 className="font-medium">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{step.desc}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 font-mono">
                    {step.cmd}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(step.cmd)
                      toast.success("Kopiert")
                    }}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Backend", icon: Terminal, ok: false },
            { label: "Chrome", icon: Globe, ok: false },
            { label: "CUA Driver", icon: Shield, ok: false },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <item.icon className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    {item.ok ? "Läuft" : "Prüfen"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
