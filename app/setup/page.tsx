"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getConfig, saveConfig, ConfigData } from "@/lib/api"
import { useProvider } from "@/components/provider-context"
import { Shield, Mail, Key, CheckCircle2, Loader2, Eye, EyeOff, Link, Terminal, Code, Globe, Monitor } from "lucide-react"

export default function SetupPage() {
  const { provider } = useProvider()
  const [gmxEmail, setGmxEmail] = useState("")
  const [gmxPassword, setGmxPassword] = useState("")
  const [fireworksPassword, setFireworksPassword] = useState("")
  const [showGmxPw, setShowGmxPw] = useState(false)
  const [showFwPw, setShowFwPw] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getConfig(provider.apiPrefix, provider.backendUrl).then((cfg: ConfigData) => {
      setGmxEmail(cfg.gmx_email)
      setGmxPassword(cfg.gmx_password)
      setFireworksPassword(cfg.fireworks_password)
      setLoading(false)
    }).catch(() => {
      setGmxEmail("opensin@gmx.de")
      setFireworksPassword("ZOE.jerry2024!")
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!gmxEmail || !gmxPassword || !fireworksPassword) {
      toast.error("Alle Felder müssen ausgefüllt sein")
      return
    }
    setSaving(true)
    try {
      await saveConfig(provider.apiPrefix, {
        gmx_email: gmxEmail,
        gmx_password: gmxPassword,
        fireworks_password: fireworksPassword,
      }, provider.backendUrl)
      setSaved(true)
      toast.success("Zugangsdaten gespeichert")
    } catch {
      toast.error("Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="size-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
            <Shield className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Zugangsdaten</h1>
          <p className="text-muted-foreground text-sm">
            GMX Konto für den Rotator — hier werden Aliases erstellt.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : saved ? (
          <Card className="border-emerald-500/50 bg-emerald-500/5">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle2 className="size-8 text-emerald-500 shrink-0" />
              <div>
                <p className="font-medium">Gespeichert</p>
                <p className="text-sm text-muted-foreground">
                  {gmxEmail} — Rotation nutzt diese Zugangsdaten.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setSaved(false)}>
                Bearbeiten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>GMX Konto</CardTitle>
                <CardDescription>
                  Der Rotator loggt sich mit diesem Konto ein, um Aliases zu erstellen und zu löschen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gmx-email" className="flex items-center gap-2">
                    <Mail className="size-4" /> GMX E-Mail
                  </Label>
                  <Input
                    id="gmx-email"
                    type="email"
                    placeholder="deinname@gmx.de"
                    value={gmxEmail}
                    onChange={(e) => setGmxEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmx-password" className="flex items-center gap-2">
                    <Key className="size-4" /> GMX Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="gmx-password"
                      type={showGmxPw ? "text" : "password"}
                      placeholder="GMX Konto Passwort"
                      value={gmxPassword}
                      onChange={(e) => setGmxPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGmxPw(!showGmxPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showGmxPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Label htmlFor="fw-password" className="flex items-center gap-2">
                    <Key className="size-4" /> Fireworks Passwort
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Wird für neue Fireworks Account-Registrierungen verwendet.
                  </p>
                  <div className="relative">
                    <Input
                      id="fw-password"
                      type={showFwPw ? "text" : "password"}
                      placeholder="Passwort für Fireworks Signup"
                      value={fireworksPassword}
                      onChange={(e) => setFireworksPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFwPw(!showFwPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showFwPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Speichern"}
                </Button>
              </CardContent>
            </Card>
          </form>
        )}

        <div className="pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Link className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">Pool-API verbinden</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Verbinde opencode, Cursor, Continue oder jeden OpenAI-kompatiblen Client mit dem SINator Key-Pool.
            Rate-Limits und tote Keys werden automatisch erkannt und getauscht.
          </p>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="size-4 text-emerald-500" />
                Endpunkt (für alle Clients gleich)
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                <span className="text-muted-foreground">baseURL: </span>
                <span className="text-emerald-500 font-medium">https://sinator.delqhi.com/inference/v1</span>
                {"\n"}
                <span className="text-muted-foreground">apiKey:  </span>
                <span className="text-amber-500 font-medium">7avN1KkfInNqcOMn2CtwLTvx</span>
              </pre>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Terminal className="size-4" />
                opencode — komplett einrichten
              </div>
              <CardDescription>Zwei Schritte — fertige Datei kopieren + env setzen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  1. Erstelle (oder ergänze) <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">~/.config/opencode/opencode.json</code> — hier die komplette Datei:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto">
{`{
  "provider": {
    "fireworks-ai": {
      "npm": "@ai-sdk/fireworks",
      "name": "Fireworks AI (SINator)",
      "options": {
        "baseURL": "https://sinator.delqhi.com/inference/v1"
      },
      "models": {
        "deepseek-v4-pro": {
          "id": "fireworks/deepseek-v4-pro",
          "name": "DeepSeek V4 Pro",
          "options": { "thinking": { "type": "enabled", "budgetTokens": 64000 } },
          "limit": { "context": 1048576, "output": 65536 }
        },
        "glm-5p1": {
          "id": "fireworks/glm-5p1",
          "name": "GLM 5.1",
          "options": { "thinking": { "type": "enabled", "budgetTokens": 32000 } },
          "limit": { "context": 202752, "output": 32768 }
        },
        "kimi-k2p6": {
          "id": "fireworks/kimi-k2p6",
          "name": "Kimi K2.6",
          "options": { "thinking": { "type": "enabled", "budgetTokens": 32000 } },
          "limit": { "context": 262144, "output": 32768 },
          "modalities": { "input": ["text","image"], "output": ["text"] }
        }
      }
    }
  },
  "default_agent": "SIN-Zeus",
  "agent": {
    "SIN-Zeus": { "model": "fireworks-ai/deepseek-v4-pro" }
  }
}`}
                </pre>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  2. API-Key in <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">~/.zshrc</code> (dann <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">source ~/.zshrc</code>):
                </p>
                <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                  <span className="text-blue-400">export </span>
                  <span className="text-foreground">FIREWORKS_API_KEY</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-amber-500">&quot;7avN1KkfInNqcOMn2CtwLTvx&quot;</span>
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Bestehende opencode.json? Nur den <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">provider.fireworks-ai</code> Block in dein existierendes <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">"provider"</code> Objekt einfügen.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Code className="size-4" />
                Cursor / Continue / Python SDK
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5"><strong>Cursor:</strong> Settings → Models → Neuen Provider</p>
                <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
                  <span className="text-muted-foreground">Base URL: </span>
                  <span className="text-emerald-500">https://sinator.delqhi.com/inference/v1</span>
                  {"\n"}
                  <span className="text-muted-foreground">API Key:  </span>
                  <span className="text-amber-500">7avN1KkfInNqcOMn2CtwLTvx</span>
                </pre>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5"><strong>Continue (VS Code):</strong> In <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">~/.continue/config.json</code></p>
                <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                  <span className="text-muted-foreground">{`{ "models": [{`}</span>{"\n"}
                  <span className="text-muted-foreground">{`  "provider": `}</span><span className="text-emerald-500">{`"openai"`}</span><span className="text-muted-foreground">,</span>{"\n"}
                  <span className="text-muted-foreground">{`  "apiBase": `}</span><span className="text-emerald-500">{`"https://sinator.delqhi.com/inference/v1"`}</span><span className="text-muted-foreground">,</span>{"\n"}
                  <span className="text-muted-foreground">{`  "apiKey": `}</span><span className="text-amber-500">{`"7avN1KkfInNqcOMn2CtwLTvx"`}</span>{"\n"}
                  <span className="text-muted-foreground">{`}] }`}</span>
                </pre>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5"><strong>Python:</strong></p>
                <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                  <span className="text-blue-400">from</span> openai <span className="text-blue-400">import</span> OpenAI{"\n"}
                  client = OpenAI({"\n"}
                  {"  "}<span className="text-foreground">base_url</span>=<span className="text-emerald-500">&quot;https://sinator.delqhi.com/inference/v1&quot;</span>,{"\n"}
                  {"  "}<span className="text-foreground">api_key</span>=<span className="text-amber-500">&quot;7avN1KkfInNqcOMn2CtwLTvx&quot;</span>,{"\n"}
                  )
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Monitor className="size-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Lokal am Mac?</p>
                  <p className="text-xs text-muted-foreground">
                    Kein API Key nötig — der Proxy erlaubt <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">localhost</code> automatisch.
                    Base URL dann: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">http://localhost:8888/inference/v1</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}