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
import { Shield, Mail, Key, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"

const API_PREFIX = "/api/v1"

export default function SetupPage() {
  const [gmxEmail, setGmxEmail] = useState("")
  const [gmxPassword, setGmxPassword] = useState("")
  const [fireworksPassword, setFireworksPassword] = useState("")
  const [showGmxPw, setShowGmxPw] = useState(false)
  const [showFwPw, setShowFwPw] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getConfig(API_PREFIX).then((cfg: ConfigData) => {
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
      await saveConfig(API_PREFIX, {
        gmx_email: gmxEmail,
        gmx_password: gmxPassword,
        fireworks_password: fireworksPassword,
      })
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Die Rotation erstellt einen neuen GMX Alias, registriert einen neuen
              Fireworks Account damit, und speichert den API Key im Pool.
            </p>
            <p>
              <strong>GMX:</strong> Login → Alias löschen → Alias erstellen → Logout
            </p>
            <p>
              <strong>Fireworks:</strong> Signup → OTP Bestätigung → Onboarding → API Key erstellen
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}