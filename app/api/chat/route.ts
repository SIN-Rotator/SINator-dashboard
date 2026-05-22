import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const maxDuration = 60

const BACKEND = process.env.SINATOR_BACKEND_URL || "http://localhost:8000"
const FIREWORKS_MODEL =
  process.env.FIREWORKS_MODEL || "accounts/fireworks/models/llama-v3p1-70b-instruct"

const SYSTEM_PROMPT = `Du bist der freundliche Hilfe-Assistent für SINator — ein Tool, das automatisch Fireworks AI API Keys erstellt.

Antworte IMMER auf Deutsch. Sei kurz, freundlich und konkret. Erkläre Dinge so, dass auch ein 12-jähriger sie versteht. Verwende keine Emojis. Verwende Markdown für Code-Blöcke und Listen.

Was SINator macht:
- Erstellt automatisch GMX-Email-Aliase
- Legt damit neue Fireworks AI Accounts an
- Bestätigt die Email-Adresse automatisch
- Generiert API Keys
- Speichert die Keys in einem lokalen Pool
- Eine Rotation dauert ca. 3 Minuten

Wichtige Bedienung:
- Auf der Startseite: großen "API Key holen"-Button drücken — fertig
- Beim ersten Mal wird einmalig nach dem Fireworks-Passwort gefragt (lokal gespeichert)
- Mit dem +/- Counter lassen sich mehrere Keys auf einmal holen (bis zu 10)
- Tastenkürzel: R = Key holen, C = letzten Key kopieren
- Auf /rotation gibt es Loop-Modus (Intervall, Ziel-Anzahl) und Live-Logs
- Auf "Erweitert" lassen sich alle Keys verwalten (kopieren, als benutzt markieren, löschen)
- Backend muss auf localhost:8000 laufen: \`python agent_toolbox/start_toolbox.py\`

Häufige Probleme:
- "Backend offline" → FastAPI-Server ist nicht gestartet
- "Falsches Passwort" → Fireworks-Passwort wurde verworfen, beim nächsten Lauf neu eingeben
- Captcha-Fehler bei GMX → einfach kurz warten und erneut versuchen
- "Rate Limit" → zu viele Anfragen, ein paar Minuten Pause

Key-Nutzung (gegen Fireworks-API):
\`\`\`bash
curl https://api.fireworks.ai/inference/v1/chat/completions \\
  -H "Authorization: Bearer DEIN_KEY" \\
  -d '{"model":"accounts/fireworks/models/llama-v3p1-70b-instruct","messages":[{"role":"user","content":"Hi"}]}'
\`\`\`

Hinweis: Du selbst läufst gerade mit einem Key aus dem SINator-Pool — das ist der beste Beweis dafür, dass das System funktioniert.

Wenn jemand eine Frage stellt, die nichts mit SINator, Fireworks oder LLMs zu tun hat, beantworte sie trotzdem kurz und hilfreich.`

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

async function fetchPoolKey(): Promise<string | null> {
  try {
    const r = await fetch(`${BACKEND}/api/v1/pool/stats`, { cache: "no-store" })
    if (!r.ok) return null
    const data = (await r.json()) as {
      keys?: Array<{ id: string; used?: boolean; api_key?: string; key?: string }>
    }
    const keys = data.keys || []
    const available = keys.find((k) => !k.used && (k.api_key || k.key))
    return (available?.api_key || available?.key) ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const apiKey = await fetchPoolKey()
  if (!apiKey) {
    return errorStream(
      "Ich kann gerade nicht antworten — es ist kein nutzbarer API Key im Pool. " +
        "Hol dir auf der Startseite einen frischen Key, dann läuft auch der Chat hier. " +
        "Falls Keys im Pool sind, gibt das Backend ihren Klartext im /pool/stats-Endpoint nicht zurück — dann hilft ein neuer Rotate-Lauf.",
    )
  }

  const fireworks = createOpenAICompatible({
    name: "fireworks",
    baseURL: "https://api.fireworks.ai/inference/v1",
    apiKey,
  })

  try {
    const result = streamText({
      model: fireworks(FIREWORKS_MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    })
    return result.toUIMessageStreamResponse()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return errorStream(
      "Die Fireworks-API hat den Pool-Key abgelehnt: " +
        msg +
        ". Der Key ist vermutlich abgelaufen oder gesperrt — auf der Startseite einen neuen holen.",
    )
  }
}
