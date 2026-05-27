"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react"

const SUGGESTED = [
  "Wie viele Keys sind im Pool?",
  "Welche Modelle gibt es?",
  "Was bedeutet suspended?",
  "Wie nutze ich den Key in Python?",
]

interface Msg {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_BASE = `Du bist der SINator-Hilfe-Assistent. Antworte IMMER auf Deutsch. Sei kurz, freundlich und konkret. Verwende Markdown fuer Code und Listen. Keine Emojis. Kein Reasoning/Thinking sichtbar - nur die direkte Antwort.

== SINATOR ARCHITEKTUR ==
SINator ist ein automatisierter Fireworks AI API-Key-Generator. Er erstellt GMX-Email-Aliases, registriert Fireworks-Accounts, bestaetigt Email per OTP, generiert API-Keys. Pro Key: ~3 Min.

Komponenten: Backend (:8000), Pool-Proxy (:8888), Landing Page (:8040), Tunnel (sinator.delqhi.com), Chrome (Profil 901, CDP 9222), CUA-Driver (macOS AX API), macOS Keychain, LaunchAgents.

== ROTATION FLOW ==
1. GMX Login → 2. Alias-Rotation (delete+create) → 3. Fireworks Signup → 4. OTP via MailCheck Extension → 5. Verify → 6. Login → 7. Onboarding → 8. API Key → 9. Pool

== KEY-STATUS ==
available=Nicht benutzt | used=Manuell verbraucht | suspended=Von Fireworks gesperrt ($5 Credits aufgebraucht)

== VERFUEGBARE MODELLE ==
gpt-oss-120b ($0.15/M) | kimi-k2p5 ($0.95/M) | kimi-k2p6 ($0.95/M) | glm-5p1 ($1.40/M) | deepseek-v4-pro ($1.74/M) | Flux-Bildmodelle

== BEKANNTE PROBLEME ==
- Fireworks Suspension bei $5 Credits-Limit
- GMX Captcha → 5-10 Min warten
- GMX: nur 1 Alias gleichzeitig
- pkill -9 Chrome VERBOTEN

== URLS ==
Landing: https://sinator.delqhi.com | Proxy: https://sinatorpool1.delqhi.com/inference/v1/ | API-Docs: https://sinator.delqhi.com/api/v1/docs

== SETUP ==
/setup: GMX Email+Passwort + Fireworks Passwort konfigurieren

== KEY NUTZUNG ==
curl https://sinatorpool1.delqhi.com/inference/v1/chat/completions -H "Authorization: Bearer 7avN1KkfInNqcOMn2CtwLTvx" -d '{"model":"accounts/fireworks/models/gpt-oss-120b","messages":[{"role":"user","content":"Hi"}]}'

Du laeuft selbst mit einem Pool-Key. Beantworte auch Fragen die nichts mit SINator zu tun haben.`

function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  const codeBlockRe = /```(\w+)?\n([\s\S]*?)```/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) blocks.push(<Inline key={key++} text={text.slice(last, m.index)} />)
    blocks.push(
      <pre key={key++} className="my-2 p-3 rounded-md bg-zinc-800 text-zinc-100 text-xs font-mono overflow-x-auto">
        <code>{m[2]}</code>
      </pre>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) blocks.push(<Inline key={key++} text={text.slice(last)} />)
  return <>{blocks}</>
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => (
        <React.Fragment key={i}>
          {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((seg, j) => {
            if (seg.startsWith("**") && seg.endsWith("**"))
              return <strong key={j}>{seg.slice(2, -2)}</strong>
            if (seg.startsWith("*") && seg.endsWith("*") && !seg.startsWith("**"))
              return <em key={j}>{seg.slice(1, -1)}</em>
            if (seg.startsWith("`") && seg.endsWith("`"))
              return <code key={j} className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs font-mono">{seg.slice(1, -1)}</code>
            return seg
          })}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  )
}

async function callChat(message: string): Promise<{ content: string; reasoning_ms: number }> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    const { invoke } = await import("@tauri-apps/api/core")
    return invoke("chat_send", { message })
  }
  throw new Error("Chat nur in SINator.app verfuegbar")
}

export function ChatPanel() {
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<Msg[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function submit(text: string) {
    const v = text.trim()
    if (!v || loading) return
    setInput("")
    setError(null)
    setLoading(true)
    setMessages((prev) => [...prev, { role: "user", content: v }])

    try {
      const result = await callChat(v)
      setMessages((prev) => [...prev, { role: "assistant", content: result.content }])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] sm:h-[640px] overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Bot className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">SINator Hilfe-Assistent</p>
          <p className="text-xs text-muted-foreground">gpt-oss-120b + Live-Pool-Stats</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
            <div className="size-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Hi! Wie kann ich helfen?</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Frag mich alles ueber SINator, API Keys oder Fireworks.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left text-xs px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`size-8 rounded-full shrink-0 flex items-center justify-center ${m.role === "user" ? "bg-primary/20 text-primary" : "bg-muted"}`}>
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full shrink-0 flex items-center justify-center bg-muted">
              <Bot className="size-4" />
            </div>
            <div className="px-4 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              denkt nach…
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(input) }}
        className="border-t p-3 flex items-center gap-2"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Frag mich was…" disabled={loading} />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </Card>
  )
}