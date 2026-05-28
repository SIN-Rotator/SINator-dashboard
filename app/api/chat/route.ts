import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const maxDuration = 60

const BACKEND = process.env.SINATOR_BACKEND_URL || "http://localhost:8000"
const FIREWORKS_MODEL =
  process.env.FIREWORKS_MODEL || "accounts/fireworks/models/gpt-oss-120b"

const fireworks = createOpenAICompatible({
  name: "fireworks",
  baseURL: `${BACKEND}:9998/inference/v1`,  // Pool-Router — kein Auth nötig für localhost
  apiKey: "pool",  // Any value works for localhost
})

const BASE_KNOWLEDGE = `Du bist der SINator-Hilfe-Assistent. Antworte IMMER auf Deutsch. Sei kurz, freundlich und konkret. Verwende Markdown fuer Code und Listen. Keine Emojis.

== SINATOR ARCHITEKTUR ==
SINator ist ein automatisierter Fireworks AI API-Key-Generator. Er erstellt GMX-Email-Aliases, registriert Fireworks-Accounts damit, bestaetigt die Email per OTP, und generiert API-Keys. Pro Key: ~3 Minuten.

Komponenten:
- Backend (FastAPI, :8000): Pool-Management, Rotation-Orchestrierung, Browser-Steuerung
- 10× Pool-Proxy (aiohttp, :8888-:8897): SSE-Dashboard, Key-Leasing, auto-swap bei 401/412, CORS
- Landing Page (:8040): Statische Website mit Live-Pool-Stats
- Tunnel (Cloudflare Named Tunnel): 1 Subdomain sinatorpool-router.delqhi.com → Pool-Router → 10 Proxys
- Chrome (Profil 901, CDP Port 9222): Browser fuer GMX/Fireworks-Automation
- CUA-Driver: macOS Accessibility API fuer Klicks (nicht als Bot detektierbar!)
- macOS Keychain: API-Keys verschluesselt gespeichert (com.sinator.pool)
- LaunchAgents: com.sinator.backend, 10× com.sinator.pool-proxy, com.sinator.pool-router, com.sinator.tunnel, com.sinator.pages, com.sinator.chrome, com.sinator.cua-driver

== ROTATION FLOW (E2E) ==
1. GMX Login (Playwright) → opensin@gmx.de → Cookies gespeichert
2. GMX Session: IAC-Tab cleanup → www.gmx.net → "E-Mail" click → SID-Polling
3. GMX Alias-Rotation: Playwright shadow DOM navigation → iframe delete + create (~41s)
4. Fireworks Logout: CDP Network.deleteCookies (nur Fireworks-Domain!)
5. Fireworks Signup: /signup → email → 2x password → Create Account
6. OTP Poll: GMX MailCheck Extension → CDP OOPIF mailbody-ui.de → Verify-URL
7. Verify: Target.createTarget(verify_url) → Account bestaetigt
8. Login: /login → "Email Login" → email + password → Next
9. Onboarding: CUA "First" + "Last" → Terms checkbox → Continue
10. Use-Cases: CUA checkboxes → Submit
11. API Key: /settings/users/api-keys → PopUpButton → menuitem → Generate
12. Pool: Auto-save zu data/fireworksai-pool.json + Keychain

== KEY-STATUS ==
- available: Nicht benutzt, Krediten vorhanden
- used: Manuell als verbraucht markiert
- suspended: Von Fireworks gesperrt (Spending-Limit erreicht, $5 Credits aufgebraucht)

== URLS ==
- Dashboard App: http://localhost:3000
- Landing Page: https://sinator.delqhi.com
- API-Docs: http://localhost:8000/docs
- Pool-Router (alle Macs): https://sinatorpool-router.delqhi.com/inference/v1
- API-Key (alle Macs): 7avN1KkfInNqcOMn2CtwLTvx

== VERFUEGBARE MODELLE (Serverless) ==
accounts/fireworks/models/gpt-oss-120b   ($0.15/M input, $0.60/M output)
accounts/fireworks/models/kimi-k2p5      ($0.95/M)
accounts/fireworks/models/kimi-k2p6      ($0.95/M)
accounts/fireworks/models/glm-5p1        ($1.40/M)
accounts/fireworks/models/deepseek-v4-pro ($1.74/M)
+ Flux Bild-Modelle (flux-1-dev-fp8, flux-1-schnell-fp8, flux-kontext-pro/max)

== BEKANNTE PROBLEME ==
- Fireworks Account Suspension: $5 Credits pro Account aufgebraucht → suspended
- GMX Captcha: Bei zu vielen Rotationen → 5-10 Min warten
- GMX erlaubt nur 1 Alias gleichzeitig (wird automatisch rotiert)
- Chrome MUSS mit Profil 901 starten (andernfalls Session tot)
- pkill -9 Chrome VERBOTEN (zerstoert SQLite → Session tot)
- waitForNavigation() bei GMX geht nicht (SPA)
- CDP wird als Bot erkannt bei GMX → CUA-Driver als Alternative

== TASTATURKUERZEL DASHBOARD ==
R = Key holen, C = letzten Key kopieren

== SETUP / ZUGANGSDATEN ==
- Auf /setup koennen GMX-Zugangsdaten konfiguriert werden
- GMX Email + Passwort (fuer Alias-Rotation)
- Fireworks Passwort (fuer neue Account-Registrierungen)
- Passwoerter werden lokal in config.json gespeichert

== KEY NUTZUNG ==
Via Pool-Router (alle Macs):
curl https://sinatorpool-router.delqhi.com/inference/v1/chat/completions \\
  -H "Authorization: Bearer 7avN1KkfInNqcOMn2CtwLTvx" \\
  -d '{"model":"accounts/fireworks/models/gpt-oss-120b","messages":[{"role":"user","content":"Hi"}]}'

Direkt mit eigenem Key:
curl https://api.fireworks.ai/inference/v1/chat/completions \\
  -H "Authorization: Bearer DEIN_KEY" \\
  -d '{"model":"accounts/fireworks/models/gpt-oss-120b","messages":[{"role":"user","content":"Hi"}]}'

Hinweis: Du selbst laeuft mit einem Key aus dem SINator-Pool via den Pool-Router (localhost:9998, kein Auth nötig).

Wenn jemand eine Frage stellt die nichts mit SINator zu tun hat, beantworte sie trotzdem kurz und hilfreich.`

function errorStream(message: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const id = "err-" + Date.now()
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      send({ type: "start" })
      send({ type: "start-step" })
      send({ type: "text-start", id })
      send({ type: "text-delta", id, delta: message })
      send({ type: "text-end", id })
      send({ type: "finish-step" })
      send({ type: "finish" })
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  })
}

async function getLiveContext(): Promise<string> {
  try {
    const [statsR, healthR] = await Promise.all([
      fetch(`${BACKEND}/api/v1/pool/stats`, { cache: "no-store" }),
      fetch(`${BACKEND}/health`, { cache: "no-store" }),
    ])
    const stats = statsR.ok ? await statsR.json() : null
    const health = healthR.ok ? await healthR.json() : null

    let ctx = "\n== LIVE-STATUS (jetzt) ==\n"
    if (stats) {
      ctx += `Pool: ${stats.available} verfuegbar / ${stats.total} gesamt / ${stats.used} verbraucht / ${stats.suspended || 0} gesperrt\n`
    } else {
      ctx += "Pool: Offline\n"
    }
    if (health) {
      ctx += `Backend: Online | Chrome: ${health.chrome ? "laeuft" : "aus"} | CUA: ${health.cua ? "laeuft" : "aus"}\n`
    } else {
      ctx += "Backend: Offline\n"
    }
    return ctx
  } catch {
    return "\n== LIVE-STATUS ==\nBackend: Offline\n"
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const liveContext = await getLiveContext()
  const systemPrompt = BASE_KNOWLEDGE + liveContext

  try {
    const result = streamText({
      model: fireworks(FIREWORKS_MODEL),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })
    return result.toUIMessageStreamResponse()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return errorStream(
      "Fehler beim Chat: " + msg + ". Ist der Pool-Router aktiv?",
    )
  }
}