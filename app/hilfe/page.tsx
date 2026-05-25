"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { ChatPanel } from "@/components/chat-panel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { HelpCircle, MessageCircle, KeyRound, Zap, ShieldCheck } from "lucide-react"

const FAQS = [
  {
    q: "Was ist SINator und was macht es?",
    a: "SINator ist ein Tool, das dir vollautomatisch Fireworks AI API Keys erstellt. Es legt für dich neue Email-Aliase bei GMX an, eröffnet damit Fireworks-Accounts, bestätigt die Email und generiert den API Key. Pro Key dauert das ungefähr 3 Minuten — du musst nichts tun außer einmal das Passwort einzugeben.",
  },
  {
    q: "Wie hole ich meinen ersten API Key?",
    a: "Auf der Startseite den großen 'API Key holen'-Button drücken. Beim ersten Mal wirst du nach deinem Fireworks-Passwort gefragt — das wird nur lokal in deinem Browser gespeichert. Danach läuft alles automatisch und der fertige Key wird direkt in deine Zwischenablage kopiert.",
  },
  {
    q: "Kann ich mehrere Keys auf einmal holen?",
    a: "Ja. Über den +/- Counter neben dem Button kannst du bis zu 10 Keys gleichzeitig anfordern. Sie werden nacheinander erstellt — du kannst den Vorgang jederzeit nach dem aktuellen Key stoppen.",
  },
  {
    q: "Wo ist mein Passwort gespeichert?",
    a: "Ausschließlich lokal in deinem Browser (localStorage). Es wird nur an dein lokales Backend auf localhost:8000 gesendet, niemals an einen fremden Server. Du kannst es jederzeit über den Link 'Passwort entfernen' unter dem Button löschen.",
  },
  {
    q: "Wie benutze ich den API Key?",
    a: "Direkt nach dem Erstellen findest du auf der Erfolgs-Seite Code-Beispiele für curl, Python und Node.js zum Kopieren. Der Key wird als Bearer-Token im Authorization-Header gegen `https://api.fireworks.ai/inference/v1/...` verwendet.",
  },
  {
    q: "Was bedeutet 'Backend offline'?",
    a: "Das FastAPI-Backend läuft nicht auf localhost:8000. Starte es mit `python agent_toolbox/start_toolbox.py` im SINator-Repo. Sobald es läuft, wird der rote Banner unten verschwinden.",
  },
  {
    q: "Was ist der Unterschied zwischen Dashboard und Rotation?",
    a: "Dashboard = der einfache Weg, einzelne oder ein paar Keys auf Knopfdruck zu holen. Rotation = die Power-User-Seite mit Loop-Modus (z.B. alle X Minuten neuer Key) und Live-Logs für lange Hintergrund-Läufe.",
  },
  {
    q: "Was passiert bei Captcha- oder Rate-Limit-Fehlern?",
    a: "GMX zeigt manchmal Captchas wenn zu viele Anfragen kommen. Einfach 5–10 Minuten warten und nochmal versuchen. Bei dauerhaften Problemen kann es helfen, die VPN-/IP-Adresse zu wechseln.",
  },
  {
    q: "Werden alte Keys automatisch gelöscht?",
    a: "Nein. Du kannst sie aber im 'Erweitert: Alle Keys verwalten'-Bereich manuell löschen oder als 'benutzt' markieren. Lokal gespeicherte Keys im Verlauf werden nach maximal 5 Stück automatisch rotiert.",
  },
]

const QUICK_FACTS = [
  { icon: Zap, label: "~3 Min", desc: "pro Key" },
  { icon: KeyRound, label: "Bis zu 10", desc: "Keys auf einmal" },
  { icon: ShieldCheck, label: "100% lokal", desc: "Passwort nie extern" },
]

export default function HilfePage() {
  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="size-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
            <HelpCircle className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Hilfe & FAQ
          </h1>
          <p className="text-base text-muted-foreground text-pretty">
            Antworten auf häufige Fragen — oder chatte direkt mit dem Assistenten unten.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK_FACTS.map(({ icon: Icon, label, desc }) => (
            <Card key={label} className="p-4 text-center">
              <Icon className="size-5 mx-auto text-primary mb-2" />
              <p className="font-bold">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>

        <Card className="p-2 sm:p-4">
          <div className="flex items-center gap-2 px-3 sm:px-2 pt-3 sm:pt-2 pb-1 mb-2">
            <HelpCircle className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Häufige Fragen</h2>
          </div>
          <Accordion type="single" collapsible className="px-2">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.a.split("`").map((part, idx) =>
                    idx % 2 === 1 ? (
                      <code
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground"
                      >
                        {part}
                      </code>
                    ) : (
                      <React.Fragment key={idx}>{part}</React.Fragment>
                    ),
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">Pool-API einrichten</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Verbinde opencode, Cursor oder jeden OpenAI-kompatiblen Client mit dem gemeinsamen Key-Pool.
            Rate-Limits werden automatisch erkannt und Keys getauscht — du merkst nichts davon.
          </p>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium mb-2">Endpunkt (für alle Clients gleich)</h3>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
                <span className="text-muted-foreground">baseURL: </span>
                <span className="text-emerald-500">https://sinator.delqhi.com/inference/v1</span>
                {"\n"}
                <span className="text-muted-foreground">apiKey:  </span>
                <span className="text-amber-500">7avN</span>
                <span className="text-muted-foreground">... (im Header)</span>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">opencode</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Zwei Schritte — Config anlegen + Umgebungsvariable setzen:
              </p>
              <p className="text-xs text-muted-foreground mb-1">
                1. In <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">~/.config/opencode/opencode.json</code> den Provider <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">fireworks-ai</code> mit dieser Option:
              </p>
              <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto my-2">
                <span className="text-muted-foreground">{`"options": { "baseURL": "`}</span>
                <span className="text-emerald-500">{`https://sinator.delqhi.com/inference/v1`}</span>
                <span className="text-muted-foreground">{`" }`}</span>
              </pre>
              <p className="text-xs text-muted-foreground mb-1">
                2. In <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">~/.zshrc</code> (oder <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">~/.bashrc</code>):
              </p>
              <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto my-2">
                <span className="text-blue-400">export </span>
                <span className="text-foreground">FIREWORKS_API_KEY</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-amber-500">&quot;7avN1KkfInNqcOMn2CtwLTvx&quot;</span>
              </pre>
              <p className="text-xs text-muted-foreground">
                Das SDK <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">@ai-sdk/fireworks</code> liest <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">FIREWORKS_API_KEY</code> automatisch als <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">Authorization: Bearer</code> Header.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Cursor / Continue / Andere</h3>
              <p className="text-xs text-muted-foreground mb-2">
                In den API-Einstellungen Base URL und API Key eintragen:
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
                <span className="text-muted-foreground">Base URL = </span>
                <span className="text-emerald-500">https://sinator.delqhi.com/inference/v1</span>
                {"\n"}
                <span className="text-muted-foreground">API Key  = </span>
                <span className="text-amber-500">7avN1KkfInNqcOMn2CtwLTvx</span>
              </pre>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-4">
              <strong className="text-foreground">Lokal am Mac?</strong> Kein API Key nötig — der Proxy erlaubt <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">localhost</code> automatisch.
            </div>
          </div>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Live-Chat mit dem Assistenten</h2>
          </div>
          <ChatPanel />
        </div>
      </main>
    </div>
  )
}
