// Provider-Registry: zentrale Konfiguration für alle Rotator-Typen
// Docs: docs/PROVIDER_API_CONVENTION.md — JEDER neue Provider MUSS diese API erfüllen
import type { ComponentType } from "react"
import { Flame, Github, Triangle, Mail, PiggyBank, Zap } from "lucide-react"

export type ProviderId = "fireworks" | "github" | "vercel" | "gmx" | "heypiggy" | "freemodel"

export interface UsageSnippets {
  curl?: string
  python?: string
  node?: string
}

export interface FaqItem {
  q: string
  a: string
}

/**
 * Provider-Capabilities: Welche Operationen unterstützt dieser Provider?
 * Wird vom Provider-Adapter (lib/adapters.ts) genutzt um UI-Operationen
 * auf die richtigen Backend-Endpoints zu mappen.
 */
export interface ProviderCapabilities {
  /** Unterstützt /pool/stats, /pool/lease, /pool/return */
  hasPool: boolean
  /** Unterstützt /rotation/full (Sub-Process basierte Rotation) */
  hasRotation: boolean
  /** Benötigt Tauri-Terminal (Browser-basierte Rotatoren wie Fireworks/HeyPiggy) */
  hasTerminalRotation: boolean
  /** Pool-Items sind API-Keys (sonst: Email+Passwort Credentials) */
  hasApiKeys: boolean
}

export interface ProviderConfig {
  id: ProviderId
  label: string
  shortLabel: string
  description: string
  icon: ComponentType<{ className?: string }>
  // Theming hint (Tailwind class snippet)
  accent: string
  // ── Backend (siehe docs/PROVIDER_API_CONVENTION.md für Port-Konvention) ──
  // ⚠️ backendUrl MUSS eindeutig sein pro Provider! 81xx Range = offizielle
  // Rotator-Ports. Niemals 8000/8001/8002 für neue Provider — kollidiert mit
  // bestehenden Services und wird von launchd gekillt.
  backendUrl: string     // z.B. "http://localhost:8101"
  apiPrefix: string      // z.B. "/api/v1" — provider-specific routes
  poolPrefix: string     // z.B. "/api/v1" — shared pool/lease/stats routes
  available: boolean     // false = "Coming soon"
  // ── Capabilities (vom Adapter genutzt) ──
  capabilities: ProviderCapabilities
  // Begriffe pro Provider
  itemNoun: string       // "API Key", "Account", "Alias"
  itemNounPlural: string // "API Keys", "Accounts", "Aliase"
  passwordLabel: string  // z.B. "Fireworks Passwort", "Master-Passwort"
  // Texte
  heroTitle: string
  heroSubtitle: string
  successTitle: string
  // Verwendungsbeispiele (optional)
  snippets?: UsageSnippets
  // FAQs für Hilfe-Seite
  faq: FaqItem[]
  // System-Prompt für Chat-Assistant
  chatSystemPrompt: string
  // Quick facts (Hilfe-Seite)
  quickFacts: { label: string; desc: string }[]
}

const FIREWORKS: ProviderConfig = {
  id: "fireworks",
  label: "Fireworks AI",
  shortLabel: "Fireworks",
  description: "API Keys für Fireworks AI Inference",
  icon: Flame,
  accent: "text-orange-500",
  backendUrl: "http://localhost:8000",  // v3 main toolbox — siehe PROVIDER_API_CONVENTION.md
  apiPrefix: "/api/v1",
  poolPrefix: "/api/v1",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: true,   // Browser-basiert → Tauri-Terminal
    hasApiKeys: true,             // Items sind Fireworks API Keys (fw_xxx)
  },
  itemNoun: "API Key",
  itemNounPlural: "API Keys",
  passwordLabel: "Fireworks Passwort",
  heroTitle: "API Key holen",
  heroSubtitle: "Ein Klick → fertig in ~3 Minuten",
  successTitle: "Dein neuer API Key",
  snippets: {
    curl: `curl https://api.fireworks.ai/inference/v1/chat/completions \\
  -H "Authorization: Bearer {KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "accounts/fireworks/models/llama-v3p1-70b-instruct",
    "messages": [{"role":"user","content":"Hallo!"}]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key="{KEY}",
)

resp = client.chat.completions.create(
    model="accounts/fireworks/models/llama-v3p1-70b-instruct",
    messages=[{"role": "user", "content": "Hallo!"}],
)
print(resp.choices[0].message.content)`,
    node: `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.fireworks.ai/inference/v1",
  apiKey: "{KEY}",
})

const resp = await client.chat.completions.create({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "Hallo!" }],
})
console.log(resp.choices[0].message.content)`,
  },
  faq: [
    {
      q: "Was macht der Fireworks-Rotator?",
      a: "Er erstellt automatisch neue Email-Aliase bei GMX, eröffnet damit Fireworks AI Accounts, bestätigt die Email und generiert API Keys. Pro Key dauert das etwa 3 Minuten.",
    },
    {
      q: "Wie hole ich meinen ersten API Key?",
      a: "Auf 'API Key holen' klicken. Beim ersten Mal wirst du nach deinem Fireworks-Passwort gefragt — wird nur lokal gespeichert. Danach läuft alles automatisch.",
    },
    {
      q: "Kann ich mehrere Keys auf einmal holen?",
      a: "Ja, bis zu 100 Stück über den +/- Counter. \"Holen\" least aus dem Pool (schnell), \"Generieren\" startet den Rotator und erstellt frische Accounts (~140s pro Key).",
    },
    {
      q: "Wie benutze ich den Key?",
      a: "Direkt nach dem Erstellen siehst du Code-Beispiele für curl, Python und Node.js. Der Key kommt als Bearer-Token gegen `https://api.fireworks.ai/inference/v1/...`.",
    },
    {
      q: "Was bedeutet 'Backend offline'?",
      a: "Das FastAPI-Backend läuft nicht. Starte es mit `python agent_toolbox/start_toolbox.py` im SINator-Repo.",
    },
    {
      q: "Was passiert bei Captchas?",
      a: "GMX zeigt manchmal Captchas. 5–10 Minuten warten und nochmal versuchen, ggf. IP wechseln.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für SINator (Fireworks AI Rotator). Antworte freundlich und kurz auf Deutsch, einfach genug für 12-Jährige. SINator erstellt automatisch Fireworks AI API Keys über GMX-Email-Aliase. Pro Key ~3 Minuten. Verwendung als Bearer-Token gegen https://api.fireworks.ai/inference/v1.`,
  quickFacts: [
    { label: "~3 Min", desc: "pro Key" },
    { label: "Bis zu 10", desc: "Keys auf einmal" },
    { label: "100% lokal", desc: "Passwort nie extern" },
  ],
}

const GITHUB: ProviderConfig = {
  id: "github",
  label: "GitHub Accounts",
  shortLabel: "GitHub",
  description: "Automatisierte GitHub Account-Erstellung",
  icon: Github,
  accent: "text-foreground",
  backendUrl: "http://localhost:8103",  // 81xx Range — siehe PROVIDER_API_CONVENTION.md
  apiPrefix: "/api/v1",
  poolPrefix: "/api/v1",
  available: false,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: true,   // Browser-basiert
    hasApiKeys: true,             // Items sind GitHub PATs
  },
  itemNoun: "Account",
  itemNounPlural: "GitHub Accounts",
  passwordLabel: "Master-Passwort",
  heroTitle: "GitHub Account erstellen",
  heroSubtitle: "Email-Alias + Account + Verifizierung in einem Schritt",
  successTitle: "Dein neuer GitHub Account",
  faq: [
    {
      q: "Was macht der GitHub-Rotator?",
      a: "Er legt automatisch GMX-Email-Aliase an, registriert damit neue GitHub-Accounts, bestätigt die Email und speichert die Login-Daten im Pool.",
    },
    {
      q: "Was kann ich mit den Accounts machen?",
      a: "Alles was ein normaler GitHub-Account kann: Repos, Issues, Stars, Fork-Botschaften, automatisierte Aktionen über die GitHub API.",
    },
    {
      q: "Werden Personal Access Tokens erstellt?",
      a: "Ja, optional kann pro Account direkt ein PAT mit Standard-Scopes generiert werden. Das siehst du im Pool unter 'token'.",
    },
    {
      q: "Wie melde ich mich mit dem Account an?",
      a: "Username + Passwort werden im Pool gespeichert. Beim ersten Login von neuer IP fragt GitHub manchmal nach Email-Verifizierung — die Email läuft über deinen GMX-Alias.",
    },
    {
      q: "Was bei Captcha?",
      a: "GitHub setzt manchmal hCaptcha ein. Der Rotator wartet automatisch und probiert es nochmal. Bei Dauerproblemen IP wechseln.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für den SINator GitHub-Account-Rotator. Antworte freundlich und kurz auf Deutsch, einfach genug für 12-Jährige. Der Rotator erstellt automatisch GitHub-Accounts mit GMX-Email-Aliasen. Optional werden Personal Access Tokens (PATs) generiert. Login-Daten werden im Pool gespeichert.`,
  quickFacts: [
    { label: "~2 Min", desc: "pro Account" },
    { label: "PAT optional", desc: "mit Standard-Scopes" },
    { label: "GMX-Alias", desc: "als Email" },
  ],
}

const VERCEL: ProviderConfig = {
  id: "vercel",
  label: "Vercel + v0",
  shortLabel: "Vercel",
  description: "Vercel AI Gateway API Keys mit Auto-Failover",
  icon: Triangle,
  accent: "text-foreground",
  // NOTE: SINator-VercelPool läuft aktuell auf 8001 (legacy, non-convention)
  // TODO: V19.2 — migrate SINator-VercelPool to port 8102 + implement standard API
  // Siehe docs/PROVIDER_API_CONVENTION.md
  backendUrl: "http://localhost:8001",
  apiPrefix: "/api/v1/vercel",
  poolPrefix: "/pool",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: false,   // Verwendet direkten Backend, kein Browser
    hasApiKeys: true,             // Items sind Vercel AI Gateway Keys
  },
  itemNoun: "AI Gateway Key",
  itemNounPlural: "AI Gateway Keys",
  passwordLabel: "AI Gateway API Key",
  heroTitle: "AI Gateway Key holen",
  heroSubtitle: "Auto-Failover Pool mit 31-Tage-Cooldown-Rotation",
  successTitle: "Dein AI Gateway Key",
  snippets: {
    curl: `# Über SINator-VercelPool (Auto-Failover)
curl http://localhost:8001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role":"user","content":"Hallo!"}]
  }'`,
    python: `from openai import OpenAI

# Über SINator-VercelPool (Auto-Failover)
client = OpenAI(
    base_url="http://localhost:8001/v1",
    api_key="pool",  # beliebig, Pool wählt Key automatisch
)

resp = client.chat.completions.create(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hallo!"}],
)
print(resp.choices[0].message.content)`,
    node: `import OpenAI from "openai"

// Über SINator-VercelPool (Auto-Failover)
const client = new OpenAI({
  baseURL: "http://localhost:8001/v1",
  apiKey: "pool",  // beliebig, Pool wählt Key automatisch
})

const resp = await client.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Hallo!" }],
})
console.log(resp.choices[0].message.content)`,
  },
  faq: [
    {
      q: "Was ist SINator-VercelPool?",
      a: "Ein intelligenter Key-Pool für Vercel AI Gateway. Er verwaltet mehrere API-Keys und wechselt automatisch bei Rate-Limits (402/429) oder Sperrungen (403) zum nächsten Key.",
    },
    {
      q: "Was ist die 31-Tage-Rotation?",
      a: "Keys werden nie gelöscht. Bei einem Fehler geht der Key für 31 Tage in Cooldown und wird danach automatisch wieder aktiviert. So gehen keine Keys verloren.",
    },
    {
      q: "Welche Modelle werden unterstützt?",
      a: "Alle Vercel AI Gateway Modelle: OpenAI (gpt-4o, gpt-4o-mini), Anthropic (claude-opus-4, claude-sonnet-4), Google (gemini-2.5-pro), und mehr.",
    },
    {
      q: "Wie füge ich neue Keys hinzu?",
      a: "Über den Pool-Manager: `python add_keys.py --keys KEY1 KEY2` oder per API: POST /pool/keys mit JSON-Body.",
    },
    {
      q: "Was passiert bei 'Pool erschöpft'?",
      a: "Alle Keys sind im Cooldown. Entweder neue Keys hinzufügen oder warten bis Keys aus dem Cooldown kommen.",
    },
    {
      q: "Brauche ich einen API-Key für den Pool?",
      a: "Nein, der Pool selbst ist unauthentifiziert (localhost). Er wählt automatisch einen aktiven Key aus dem Pool für jede Anfrage.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für SINator-VercelPool. Antworte freundlich und kurz auf Deutsch, einfach genug für 12-Jährige. 

SINator-VercelPool ist ein Key-Pool-Router für Vercel AI Gateway:
- Verwaltet mehrere AI_GATEWAY_API_KEYs in einer SQLite-Datenbank
- Wählt automatisch den ältesten ungenutzten Key (LRU)
- Bei 402/429/403 Fehlern: automatischer Retry mit nächstem Key
- 31-Tage-Cooldown: Keys werden nie gelöscht, nur pausiert
- Unterstützt alle Vercel AI Gateway Modelle (OpenAI, Anthropic, Google, etc.)

Nutzung: Einfach gegen localhost:8001/v1 anfragen, Pool übernimmt Key-Management.`,
  quickFacts: [
    { label: "Auto-Failover", desc: "bei Rate-Limits" },
    { label: "31 Tage", desc: "Cooldown-Rotation" },
    { label: "LRU", desc: "Key-Auswahl" },
  ],
}

const GMX: ProviderConfig = {
  id: "gmx",
  label: "GMX Aliase",
  shortLabel: "GMX",
  description: "GMX Email-Alias-Verwaltung",
  icon: Mail,
  accent: "text-blue-500",
  backendUrl: "http://localhost:8100",  // 81xx Range — gleicher Port wie Fireworks weil im selben Repo
  apiPrefix: "/api/v1",
  poolPrefix: "/api/v1",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: true,   // Browser-basiert
    hasApiKeys: false,            // Items sind Email-Aliase, keine API Keys
  },
  itemNoun: "Alias",
  itemNounPlural: "GMX Aliase",
  passwordLabel: "GMX Master-Passwort",
  heroTitle: "Email-Alias erstellen",
  heroSubtitle: "Neuer GMX-Alias in unter 60 Sekunden",
  successTitle: "Dein neuer Alias",
  faq: [
    {
      q: "Was ist ein GMX-Alias?",
      a: "Eine zusätzliche Email-Adresse, die im selben Postfach landet wie dein Hauptaccount. GMX erlaubt mehrere kostenlos.",
    },
    {
      q: "Wofür brauche ich Aliase?",
      a: "Um für jeden Service (Fireworks, GitHub, Vercel...) eine separate Email zu nutzen — ohne neue Postfächer zu pflegen.",
    },
    {
      q: "Wie viele Aliase kann ich erstellen?",
      a: "GMX erlaubt typischerweise bis zu 10 aktive Aliase pro Account. Bei Bedarf alte deaktivieren.",
    },
    {
      q: "Empfange ich Mails an den Alias?",
      a: "Ja, alle Mails landen im Hauptpostfach. Über `From:`-Filter kannst du sie sortieren.",
    },
    {
      q: "Kann ich auch vom Alias senden?",
      a: "Ja, GMX erlaubt 'Senden als' für jeden bestätigten Alias. Im Webmail beim Verfassen umstellen.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für den SINator GMX-Alias-Rotator. Antworte freundlich und kurz auf Deutsch, einfach genug für 12-Jährige. Der Rotator erstellt automatisch neue Email-Aliase im GMX-Account, die alle ins selbe Postfach laufen. Werden für andere Rotatoren als Wegwerf-Email genutzt.`,
  quickFacts: [
    { label: "<60s", desc: "pro Alias" },
    { label: "Bis 10", desc: "aktive Aliase" },
    { label: "Senden+Empfangen", desc: "voll funktional" },
  ],
}

const HEYPIGGY: ProviderConfig = {
  id: "heypiggy",
  label: "HeyPiggy",
  shortLabel: "HeyPiggy",
  description: "HeyPiggy Accounts mit GMX-Alias registrieren",
  icon: PiggyBank,
  accent: "text-pink-500",
  // ✅ Eigener Port in 81xx Range (HeyPiggy läuft auf 8101, NICHT 8002!)
  // Vorher: backendUrl: "http://localhost:8002" → Kollision mit Vercel-Rotator
  backendUrl: "http://localhost:8101",
  apiPrefix: "/api/v1",
  poolPrefix: "/api/v1",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: true,
    hasTerminalRotation: true,   // Browser-basiert → Tauri-Terminal
    hasApiKeys: false,            // Items sind Email+Passwort Credentials, keine API Keys
  },

  itemNoun: "Account",
  itemNounPlural: "HeyPiggy Accounts",
  passwordLabel: "Master-Passwort",
  heroTitle: "HeyPiggy Account holen",
  heroSubtitle: "Neuer GMX-Alias + HeyPiggy Registrierung in ~3 Min",
  successTitle: "Neuer HeyPiggy Account",
  faq: [
    {
      q: "Was macht der HeyPiggy-Rotator?",
      a: "Er erstellt neue GMX-Aliase, registriert damit HeyPiggy-Accounts über den Invite-Link und speichert Email + Passwort im Pool.",
    },
    {
      q: "Wie nutze ich den Account?",
      a: "Die Zugangsdaten (Email + Passwort) werden im Pool gespeichert. Einfach auf heypiggy.com mit den Daten einloggen.",
    },
    {
      q: "Kann ich mehrere Accounts gleichzeitig nutzen?",
      a: "Ja, jeder Account läuft unabhängig. Du kannst bis zu 10 parallel erstellen.",
    },
    {
      q: "Was passiert mit den Accounts?",
      a: "Sie werden mit deinem GMX-Alias verknüpft — alle Mails landen in deinem Hauptpostfach. Passwort kannst du später ändern.",
    },
    {
      q: "Was bei Fehlern?",
      a: "GMX zeigt manchmal Captchas — einfach 5-10 Minuten warten. HeyPiggy Registrierung kann bei bereits belegtem Alias fehlschlagen.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für den SINator HeyPiggy-Rotator. Antworte freundlich und kurz auf Deutsch, einfach genug für 12-Jährige. Der Rotator erstellt automatisch GMX-Email-Aliase und registriert damit HeyPiggy-Accounts über den Invite-Link https://www.heypiggy.com?invite=UD62VKW. Die Zugangsdaten (Email + Passwort) werden im Pool gespeichert. Einfach auf heypiggy.com mit den Daten einloggen.`,
  quickFacts: [
    { label: "~3 Min", desc: "pro Account" },
    { label: "GMX-Alias", desc: "als Email" },
    { label: "Email+Passwort", desc: "im Pool gespeichert" },
  ],
}

const FREEMODEL: ProviderConfig = {
  id: "freemodel",
  label: "FreeModel.dev",
  shortLabel: "FreeModel",
  description: "FreeModel.dev Key-Pool Proxy — OpenAI + Claude",
  icon: Zap,
  accent: "text-cyan-500",
  backendUrl: "http://localhost:8787",
  apiPrefix: "/v1",
  poolPrefix: "",
  available: true,
  capabilities: {
    hasPool: true,
    hasRotation: false,
    hasTerminalRotation: false,
    hasApiKeys: true,
  },
  itemNoun: "API Key",
  itemNounPlural: "API Keys",
  passwordLabel: "FreeModel API Key",
  heroTitle: "Key-Pool Status",
  heroSubtitle: "Live-Anzeige aller FreeModel Keys mit Cooldown-Timer",
  successTitle: "FreeModel Key-Pool",
  faq: [
    {
      q: "Was ist der FreeModel Key-Pool?",
      a: "Ein lokaler Proxy (localhost:8787), der mehrere FreeModel API Keys verwaltet. Er rotiert automatisch bei Rate-Limits (402) und 'Insufficient balance' (401) und kühlt limitierte Keys bis zu deren Reset-Zeit.",
    },
    {
      q: "Wie füge ich neue Keys hinzu?",
      a: "Keys werden in der .env-Datei des Pool-Proxies eingetragen (kommasepariert). Der Pool übernimmt neue Keys per Hot-Reload innerhalb von 15 Sekunden — kein Restart nötig.",
    },
    {
      q: "Welche Modelle werden unterstützt?",
      a: "OpenAI: gpt-5.6-terra, gpt-5.5, gpt-5.4. Claude: claude-sonnet-5, claude-fable-5, claude-opus-4-8. Der Pool leitet an api.freemodel.dev (OpenAI) und cc.freemodel.dev (Claude) weiter.",
    },
    {
      q: "Was bedeutet 'cooling'?",
      a: "Der Key hat ein Rate-Limit (402) oder 'Insufficient balance' (401) erhalten und ist vorübergehend pausiert. Er wird automatisch wieder aktiviert, wenn die Cooldown-Zeit abläuft.",
    },
    {
      q: "Was bedeutet 'Access Denied'?",
      a: "cc.freemodel.dev akzeptiert nur den offiziellen Claude Code Client. Das ist normal für Direkt-Tests — durch den Pool mit echtem Claude Code funktioniert es.",
    },
  ],
  chatSystemPrompt: `Du bist der Hilfe-Assistent für den FreeModel Key-Pool. Antworte freundlich und kurz auf Deutsch. Der Pool ist ein Proxy auf localhost:8787, der mehrere FreeModel API Keys verwaltet, bei Rate-Limits rotiert und Keys automatisch kühlt/reaktiviert.`,
  quickFacts: [
    { label: "Auto-Rotation", desc: "bei 401/402/429" },
    { label: "Hot-Reload", desc: "Keys in 15s" },
    { label: "OpenAI+Claude", desc: "beide Routen" },
  ],
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  fireworks: FIREWORKS,
  github: GITHUB,
  vercel: VERCEL,
  gmx: GMX,
  heypiggy: HEYPIGGY,
  freemodel: FREEMODEL,
}

export const PROVIDER_LIST: ProviderConfig[] = [FIREWORKS, HEYPIGGY, FREEMODEL, GITHUB, VERCEL, GMX]

export const DEFAULT_PROVIDER: ProviderId = "fireworks"

export function getProvider(id: string | null | undefined): ProviderConfig {
  if (id && id in PROVIDERS) return PROVIDERS[id as ProviderId]
  return PROVIDERS[DEFAULT_PROVIDER]
}

/**
 * Get the standard /health URL for a provider.
 * Used for liveness checks before any other API call.
 *
 * @example
 *   getProviderHealthUrl("heypiggy") // "http://localhost:8101/health"
 */
export function getProviderHealthUrl(provider: ProviderConfig): string {
  return `${provider.backendUrl}/health`
}

/**
 * Get the standard /pool/stats URL for a provider.
 * Used by the Dashboard's stat cards.
 */
export function getProviderStatsUrl(provider: ProviderConfig): string {
  return `${provider.backendUrl}${provider.poolPrefix}/pool/stats`
}

/**
 * Get the standard /pool-lease URL for a provider.
 * Used by the "Holen" button.
 */
export function getProviderLeaseUrl(provider: ProviderConfig): string {
  return `${provider.backendUrl}${provider.poolPrefix}/pool-lease`
}

/**
 * Get the standard /rotation/full URL for a provider.
 * Used by the "Generieren" button (when not using Tauri terminal).
 */
export function getProviderRotationUrl(provider: ProviderConfig): string {
  return `${provider.backendUrl}${provider.apiPrefix}/rotation/full`
}
