"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
  Lock,
  Minus,
  Plus,
  HelpCircle,
  Zap,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { revealKey, type RotationResult } from "@/lib/api"
import { addToHistory } from "@/lib/key-history"
import { UsageSnippet } from "@/components/usage-snippet"
import { useProvider } from "@/components/provider-context"
import { invoke } from "@tauri-apps/api/core"

const ONBOARDING_KEY = "sinator.onboarding_seen"

type Phase = "idle" | "running" | "success" | "error"

const MAX_KEYS = 100

interface Props {
  available: number
  connected: boolean
  onDone: () => void
  onHistoryUpdate: () => void
}

export function GetKeyHero({ available, connected, onDone, onHistoryUpdate }: Props) {
  const { provider } = useProvider()
  const ProviderIcon = provider.icon

  // Provider-spezifische Schritte
  const PROGRESS_STEPS = React.useMemo(() => {
    switch (provider.id) {
      case "fireworks":
        return [
          "GMX Email-Alias erstellen",
          "Fireworks Account anlegen",
          "Email bestätigen",
          "API Key generieren",
        ]
      case "github":
        return [
          "GMX Email-Alias erstellen",
          "GitHub Account registrieren",
          "Email bestätigen",
          "Personal Access Token erstellen",
        ]
      case "vercel":
        return [
          "GMX Email-Alias erstellen",
          "Vercel Account registrieren",
          "Email bestätigen",
          "v0 Trial aktivieren & Token generieren",
        ]
      case "gmx":
        return ["GMX-Login öffnen", "Neuen Alias eintragen", "Speichern & verifizieren"]
      default:
        return ["Vorbereiten", "Erstellen", "Bestätigen", "Fertig"]
    }
  }, [provider.id])

  // Storage-Keys provider-spezifisch
  const passwordKey = `sinator.password.${provider.id}`

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [progressIdx, setProgressIdx] = React.useState(0)
  const [result, setResult] = React.useState<RotationResult | null>(null)
  const [errMsg, setErrMsg] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [count, setCount] = React.useState(1)
  const [currentRun, setCurrentRun] = React.useState(0)
  const [collectedKeys, setCollectedKeys] = React.useState<RotationResult[]>([])
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const cancelRef = React.useRef(false)

  const [pwOpen, setPwOpen] = React.useState(false)
  const [pwInput, setPwInput] = React.useState("family")
  const [savePw, setSavePw] = React.useState(true)

  const [showOnboarding, setShowOnboarding] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.localStorage.getItem(ONBOARDING_KEY) && available === 0) {
      setShowOnboarding(true)
    }
  }, [available])

  // Reset State bei Provider-Wechsel
  React.useEffect(() => {
    setPhase("idle")
    setResult(null)
    setErrMsg(null)
    setCollectedKeys([])
    setStartedAt(null)
    setProgressIdx(0)
  }, [provider.id])

  React.useEffect(() => {
    if (phase !== "running" || !startedAt) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase, startedAt])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === "r" && phase === "idle" && connected) {
        e.preventDefault()
        handleClick()
      } else if (e.key.toLowerCase() === "c" && phase === "success" && result?.api_key) {
        e.preventDefault()
        copyKey()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, connected, result, provider.id])

  function getStoredPassword(): string | null {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(passwordKey)
  }

  function dismissOnboarding() {
    if (typeof window !== "undefined") window.localStorage.setItem(ONBOARDING_KEY, "1")
    setShowOnboarding(false)
  }

  async function handleClick() {
    dismissOnboarding()
    if (!connected) {
      toast.error("Backend nicht erreichbar", {
        description: "Starte zuerst den FastAPI-Server auf localhost:8000.",
      })
      return
    }
    if (available <= 0) {
      toast.error("Pool ist leer", {
        description: "Nutze den \"Generieren\"-Button, um neue Keys zu erstellen.",
      })
      return
    }
    if (count > 1) {
      doLeaseMulti(count)
    } else {
      doLease()
    }
  }

  async function handleGenerate() {
    dismissOnboarding()
    const stored = getStoredPassword()
    if (!stored) {
      setPwOpen(true)
      return
    }
    openTerminal(stored, count)
  }

  async function doLease() {
    setPhase("running")
    setProgressIdx(0)
    setResult(null)
    setErrMsg(null)
    setCopied(false)
    setCollectedKeys([])
    const startedAt = Date.now()
    setStartedAt(startedAt)
    setElapsed(0)
    try {
      const leaseRes = await fetch(`${provider.backendUrl}${provider.apiPrefix}/pool-lease?leased_to=dashboard-${startedAt}`, {
        cache: "no-store",
      })
      if (!leaseRes.ok) throw new Error("Lease fehlgeschlagen")
      const leaseData = await leaseRes.json() as { api_key: string; alias_email: string; key_name: string; key_id: string }
      const took = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(took)
      setPhase("success")
      setResult({
        status: "success",
        api_key: leaseData.api_key,
        gmx_alias: leaseData.alias_email,
        fireworks_account: leaseData.alias_email,
        api_key_name: leaseData.key_name,
        steps_completed: ["key_leased_from_pool"],
        steps_failed: [],
        execution_time: `${took}s`,
      })
      setProgressIdx(PROGRESS_STEPS.length - 1)
      addToHistory({
        id: leaseData.key_id,
        alias: leaseData.alias_email,
        keyName: leaseData.key_name,
        status: "success",
        apiKey: leaseData.api_key,
      })
    } catch (e) {
      setPhase("error")
      setErrMsg((e as Error).message || "Leasen fehlgeschlagen")
    }
  }

  async function doLeaseMulti(n: number) {
    setPhase("running")
    setProgressIdx(0)
    setResult(null)
    setErrMsg(null)
    setCopied(false)
    setCollectedKeys([])
    const startedAt = Date.now()
    setStartedAt(startedAt)
    setElapsed(0)
    setCurrentRun(0)
    cancelRef.current = false
    const collected: RotationResult[] = []
    for (let i = 0; i < n; i++) {
      if (cancelRef.current) break
      setCurrentRun(i + 1)
      try {
        const leaseRes = await fetch(`${provider.backendUrl}${provider.apiPrefix}/pool-lease?leased_to=dashboard-${startedAt}`, { cache: "no-store" })
        if (!leaseRes.ok) throw new Error("Lease fehlgeschlagen")
        const leaseData = await leaseRes.json() as { api_key: string; alias_email: string; key_name: string; key_id: string }
        const took = Math.floor((Date.now() - startedAt) / 1000)
        const res: RotationResult = {
          status: "success",
          api_key: leaseData.api_key,
          gmx_alias: leaseData.alias_email,
          fireworks_account: leaseData.alias_email,
          api_key_name: leaseData.key_name,
          steps_completed: ["key_leased_from_pool"],
          steps_failed: [],
          execution_time: `${took}s`,
        }
        collected.push(res)
        setCollectedKeys([...collected])
        addToHistory({ id: leaseData.key_id, alias: leaseData.alias_email, keyName: leaseData.key_name, status: "success", apiKey: leaseData.api_key })
      } catch (e) {
        setErrMsg((e as Error).message)
        break
      }
    }
    const took = Math.floor((Date.now() - startedAt) / 1000)
    setElapsed(took)
    if (collected.length > 0) {
      setResult(collected[collected.length - 1])
      setPhase("success")
    } else {
      setPhase("error")
    }
  }

  function submitPassword() {
    if (!pwInput) {
      toast.error("Bitte Passwort eingeben")
      return
    }
    if (savePw && typeof window !== "undefined") {
      window.localStorage.setItem(passwordKey, pwInput)
    }
    setPwOpen(false)
    const pw = pwInput
    setPwInput("")
    openTerminal(pw, count)
  }

  async function openTerminal(password: string, total: number) {
    try {
      const msg = await invoke("open_terminal_rotate", { password, count: total })
      toast.success("Terminal geöffnet", {
        description: `Rotation für ${total} ${total === 1 ? provider.itemNoun : provider.itemNounPlural} läuft im Terminal…`,
      })
      setPhase("running")
      setStartedAt(Date.now())
      setElapsed(0)
      setCurrentRun(0)
      setProgressIdx(0)
    } catch (e) {
      toast.error("Terminal konnte nicht geöffnet werden", {
        description: (e as Error).message,
      })
    }
  }

  function cancelRun() {
    cancelRef.current = true
    toast.info("Wird nach aktuellem Schritt abgebrochen…")
  }

  async function copyKey() {
    if (!result?.api_key) return
    try {
      await navigator.clipboard.writeText(result.api_key)
      setCopied(true)
      toast.success("Kopiert")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopieren fehlgeschlagen")
    }
  }

  function reset() {
    setPhase("idle")
    setResult(null)
    setErrMsg(null)
    setProgressIdx(0)
    setCollectedKeys([])
    setStartedAt(null)
  }

  function clearStoredPassword() {
    if (typeof window !== "undefined") window.localStorage.removeItem(passwordKey)
    toast.success("Passwort entfernt", { description: "Du wirst es beim nächsten Mal wieder gefragt." })
  }

  function friendlyError(msg: string): string {
    if (/401|403|auth|password/i.test(msg)) return `Falsches ${provider.passwordLabel}. Bitte erneut eingeben.`
    if (/timeout|ETIMEDOUT/i.test(msg)) return "Zeitüberschreitung — der Browser-Agent reagiert nicht."
    if (/captcha/i.test(msg)) return "Captcha aufgetaucht. Bitte später erneut versuchen."
    if (/rate.?limit|429/i.test(msg)) return "Zu viele Anfragen. Bitte ein paar Minuten warten."
    if (/404|not found/i.test(msg)) return `Endpoint nicht gefunden — Backend unterstützt diesen Rotator vielleicht noch nicht (${provider.apiPrefix}).`
    if (/ECONNREFUSED|fetch failed|Failed to fetch/i.test(msg)) return "Backend antwortet nicht. Läuft FastAPI auf localhost:8000?"
    return msg
  }

  // ============ RENDER ============

  if (phase === "success" && result?.api_key) {
    const multi = collectedKeys.length > 1
    return (
      <Card className="p-6 sm:p-10 border-2 border-emerald-500/40 bg-emerald-500/5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Check className="size-7 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {multi
              ? `Fertig! ${collectedKeys.length} ${provider.itemNounPlural} erstellt`
              : `Fertig! Hier ist dein ${provider.itemNoun}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {multi
              ? "Letzter wurde automatisch kopiert. Alle findest du im Verlauf unten."
              : "Wurde automatisch in deine Zwischenablage kopiert."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {provider.itemNoun}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 px-4 py-3 rounded-md bg-background border font-mono text-sm break-all">
              {result.api_key}
            </code>
            <Button onClick={copyKey} size="lg" className="sm:w-auto">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Kopiert" : "Kopieren"}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
            {result.api_key_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Name:</span>
                <code className="font-mono text-foreground">{result.api_key_name}</code>
              </div>
            )}
            {result.execution_time && (
              <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
                <span>Dauer:</span>
                <span className="text-foreground">{result.execution_time}</span>
              </div>
            )}
          </div>
        </div>

        {provider.snippets && (
          <div className="mt-6 pt-6 border-t">
            <UsageSnippet apiKey={result.api_key} />
          </div>
        )}

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row gap-2">
          <Button onClick={reset} variant="outline" className="sm:flex-1 bg-transparent">
            <Sparkles className="size-4" />
            Noch einen holen
          </Button>
          <Link href="/hilfe" className="sm:flex-1">
            <Button variant="ghost" className="w-full">
              <HelpCircle className="size-4" />
              Hilfe & Chat
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (phase === "running") {
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return (
      <Card className="p-6 sm:p-10">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Loader2 className="size-7 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {count > 1
              ? `${provider.itemNoun} ${currentRun} von ${count} wird erstellt…`
              : `Dein ${provider.itemNoun} wird erstellt…`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Läuft seit {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          {collectedKeys.length > 0 && (
            <p className="text-xs text-emerald-500">
              {collectedKeys.length} bereits fertig
            </p>
          )}
        </div>

        <ol className="mt-8 space-y-3 max-w-md mx-auto">
          {PROGRESS_STEPS.map((step, i) => {
            const done = i < progressIdx
            const active = i === progressIdx
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <div
                  className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? "bg-emerald-500/20 text-emerald-500"
                      : active
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                <span
                  className={
                    done
                      ? "text-muted-foreground line-through"
                      : active
                        ? "font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {step}
                </span>
              </li>
            )
          })}
        </ol>

        {count > 1 && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" onClick={cancelRun} className="text-muted-foreground">
              Nach diesem stoppen
            </Button>
          </div>
        )}
      </Card>
    )
  }

  if (phase === "error") {
    return (
      <Card className="p-6 sm:p-10 border-2 border-destructive/40 bg-destructive/5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-full bg-destructive/15 flex items-center justify-center">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Hat leider nicht geklappt</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {errMsg ?? "Etwas ist schiefgelaufen. Versuch es nochmal."}
          </p>
          {collectedKeys.length > 0 && (
            <p className="text-xs text-emerald-500">
              Aber: {collectedKeys.length} {collectedKeys.length === 1 ? "wurde" : "wurden"} schon erstellt — siehe Verlauf.
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset} variant="outline">Schließen</Button>
          <Link href="/hilfe">
            <Button variant="ghost">
              <HelpCircle className="size-4" />
              Hilfe holen
            </Button>
          </Link>
          <Button onClick={handleClick}>
            <Sparkles className="size-4" />
            Nochmal versuchen
          </Button>
        </div>
      </Card>
    )
  }

  // IDLE
  return (
    <>
      <Card className="p-6 sm:p-12 bg-gradient-to-br from-primary/10 via-card to-card border-2">
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center">
            <ProviderIcon className={`size-8 ${provider.accent}`} />
          </div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {provider.label}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            {provider.heroTitle}
          </h1>
          <p className="text-base text-muted-foreground text-pretty max-w-lg">
            {provider.heroSubtitle}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Holen</strong> = aus Pool leasen (schnell) · <strong>Generieren</strong> = Rotator starten (~140s/Key) · Bis zu 100 Stück
          </p>

          {showOnboarding && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/40 border rounded-md px-3 py-2 max-w-md">
              <strong className="text-foreground">Erstes Mal hier?</strong> Klick einfach den Knopf.
              Beim ersten Lauf fragen wir einmalig dein {provider.passwordLabel} ab — danach läuft alles
              auf Knopfdruck.
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Wie viele?</span>
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1}
                aria-label="Weniger"
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[2ch] text-center font-bold text-lg tabular-nums">{count}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setCount((c) => Math.min(MAX_KEYS, c + 1))}
                disabled={count >= MAX_KEYS}
                aria-label="Mehr"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button
              size="lg"
              onClick={handleClick}
              disabled={!connected}
              className="h-14 px-8 text-base"
            >
              <Sparkles className="size-5" />
              {count === 1
                ? `${provider.itemNoun} holen`
                : `${count} ${provider.itemNounPlural} holen`}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleGenerate}
              disabled={!connected}
              className="h-14 px-8 text-base"
            >
              <Zap className="size-5 mr-2" />
              {count === 1
                ? `${provider.itemNoun} generieren`
                : `${count} ${provider.itemNounPlural} generieren`}
            </Button>
          </div>

          {!connected && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-2">
              <AlertCircle className="size-3.5" />
              Backend ist offline — bitte zuerst FastAPI starten
            </p>
          )}

          {connected && (
            <p className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-2 justify-center">
              <span>
                {available > 0
                  ? `${available} ${available === 1 ? "wartet" : "warten"} im Pool`
                  : "Pool ist leer"}
              </span>
              <span aria-hidden>·</span>
              <span>
                Tipp: <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px]">R</kbd> drücken
              </span>
              {getStoredPassword() && (
                <>
                  <span aria-hidden>·</span>
                  <button onClick={clearStoredPassword} className="underline hover:text-foreground">
                    Passwort entfernen
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </Card>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              Einmalige Einrichtung — {provider.label}
            </DialogTitle>
            <DialogDescription>
              Wir brauchen dein {provider.passwordLabel}, um den Vorgang zu starten. Es wird nur lokal
              in deinem Browser gespeichert — nie auf einen fremden Server gesendet (außer ans
              Backend auf localhost).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="setup-pw">{provider.passwordLabel}</Label>
              <Input
                id="setup-pw"
                type="password"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                placeholder="family"
                onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={savePw}
                onChange={(e) => setSavePw(e.target.checked)}
                className="size-4 accent-primary"
              />
              Passwort merken (nur dieser Browser)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Abbrechen</Button>
            <Button onClick={submitPassword} disabled={!pwInput}>
              <Sparkles className="size-4" />
              Los geht&apos;s
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
