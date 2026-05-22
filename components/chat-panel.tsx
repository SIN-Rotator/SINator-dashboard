"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react"

const SUGGESTED = [
  "Wie hole ich meinen ersten API Key?",
  "Was bedeutet 'Backend offline'?",
  "Wie nutze ich den Key in Python?",
  "Wie hole ich mehrere Keys auf einmal?",
]

function getText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return ""
  return msg.parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text!)
    .join("")
}

function renderMarkdown(text: string): React.ReactNode {
  // Sehr einfacher Markdown-Renderer für Code-Blöcke und Inline-Code
  const parts: React.ReactNode[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = codeBlockRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(renderInline(text.slice(lastIndex, m.index), key++))
    }
    parts.push(
      <pre
        key={key++}
        className="my-2 p-3 rounded-md bg-background border text-xs font-mono overflow-x-auto"
      >
        <code>{m[2]}</code>
      </pre>,
    )
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) {
    parts.push(renderInline(text.slice(lastIndex), key++))
  }
  return parts
}

function renderInline(text: string, key: number): React.ReactNode {
  const lines = text.split("\n")
  return (
    <span key={key}>
      {lines.map((line, i) => {
        const inlineCodeRegex = /`([^`]+)`/g
        const segs: React.ReactNode[] = []
        let last = 0
        let mm: RegExpExecArray | null
        let idx = 0
        while ((mm = inlineCodeRegex.exec(line)) !== null) {
          if (mm.index > last) segs.push(line.slice(last, mm.index))
          segs.push(
            <code
              key={idx++}
              className="px-1 py-0.5 rounded bg-muted font-mono text-xs"
            >
              {mm[1]}
            </code>,
          )
          last = mm.index + mm[0].length
        }
        if (last < line.length) segs.push(line.slice(last))
        return (
          <React.Fragment key={i}>
            {segs.length ? segs : line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        )
      })}
    </span>
  )
}

export function ChatPanel() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  function submit(text: string) {
    const v = text.trim()
    if (!v || isStreaming) return
    sendMessage({ text: v })
    setInput("")
  }

  return (
    <Card className="flex flex-col h-[600px] sm:h-[640px] overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Bot className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">SINator Hilfe-Assistent</p>
          <p className="text-xs text-muted-foreground">Stell mir alle Fragen rund um Keys</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
            <div className="size-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Hi! Wie kann ich helfen?</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Frag mich alles über SINator, API Keys oder die Fireworks-Nutzung.
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

        {messages.map((m) => {
          const isUser = m.role === "user"
          const text = getText(m)
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`size-8 rounded-full shrink-0 flex items-center justify-center ${
                  isUser ? "bg-primary/20 text-primary" : "bg-muted"
                }`}
              >
                {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {text ? renderMarkdown(text) : (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    denkt nach…
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            Fehler beim Antworten: {error.message}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(input)
        }}
        className="border-t p-3 flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frag mich was…"
          disabled={isStreaming}
          aria-label="Nachricht"
        />
        <Button type="submit" disabled={isStreaming || !input.trim()} size="icon">
          {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span className="sr-only">Senden</span>
        </Button>
      </form>
    </Card>
  )
}
