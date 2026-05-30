# lib/providers.ts

Provider Registry — zentrale Konfiguration für alle SINator Rotator-Typen. 5 Provider: Fireworks, HeyPiggy, GitHub, Vercel, GMX. Jeder Provider hat eigenes `backendUrl`, `apiPrefix`, FAQ, Chat-System-Prompt, Usage-Snippets.

## Berührt

- `components/provider-context.tsx` — Provider-Switcher nutzt `getProvider()`
- `components/provider-switcher.tsx` — Dropdown aus `PROVIDER_LIST`
- `hooks/use-sinator.ts` — `backendUrl` + `apiPrefix` aus aktuellem Provider
- `app/hilfe/page.tsx` — FAQ aus `provider.faq`
- `components/usage-snippet.tsx` — Code-Snippets aus `provider.snippets`
- `components/chat-panel.tsx` — System-Prompt aus `provider.chatSystemPrompt`

## Provider Matrix

| Provider | Backend | apiPrefix | Status | Icon |
|----------|---------|-----------|--------|------|
| Fireworks AI | :8000 | /api/v1 | ✅ Aktiv | Flame |
| HeyPiggy | :8002 | /api/v1 | ✅ Aktiv | PiggyBank |
| GitHub | :8000 | /api/v1/github | ✅ Aktiv | Github |
| Vercel | :8000 | /api/v1/vercel | ✅ Aktiv | Triangle |
| GMX | :8000 | /api/v1/gmx | ✅ Aktiv | Mail |

## Wichtige Entscheidungen

- **Single Source of Truth:** ALLE Provider-Daten hier — nicht über Komponenten verteilt
- **`available` Flag:** false = "Coming soon" im Provider-Switcher
- **`itemNoun` / `itemNounPlural`:** Provider-spezifische Labels ("API Key" vs "Account")
- **FAQ per Provider:** Jeder Provider hat eigene FAQ-Liste für die Hilfe-Seite
- **Chat-System-Prompt:** Per Provider — wird in chat-panel.tsx verwendet
- **DEFAULT_PROVIDER:** `fireworks` — wird geladen wenn kein Provider in localStorage
