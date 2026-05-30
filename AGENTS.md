# AGENTS.md — SINator Dashboard (2026-05-30, V15.1)

## SINator-fireworksai V15.1 Integration
- Backend: `http://localhost:8000` (225+ Keys, Session Reuse, Use-Cases Fix)
- Pool-Router: `http://localhost:9998` (10 Proxies :8888-:8897)
- `/api/v1/config` → GMX/Fireworks Credentials
- `/api/v1/pool/stats` → Pool Statistics
- `/api/v1/pool/events` → SSE Live-Updates
- `/api/v1/rotation/full` → E2E Rotation (~140s)
- `/api/v1/browser/status` → Chrome/Profile Status

## Quick Commands
```bash
cd ~/dev/SINator-dashboard && ./start.sh   # Alles starten
cd ~/dev/SINator-dashboard && ./build.sh    # App NEU BAUEN (nach Code-Änderungen!)
```

## ⚠️ ABSOLUTE REGEL: Tauri Release Build

Die Tauri `.app` ist **statisch** (Next.js `output: "export"`). Sie hat **kein Hot-Reload**.
Nach JEDER Änderung an `lib/`, `components/`, `hooks/`, `app/` MUSS `./build.sh` laufen.

- `pnpm dev` → Next.js Dev Server (:3000) — Hot-Reload, nur für Browser
- `pnpm tauri dev` → Tauri Dev (verbindet sich mit :3000) — Hot-Reload  
- `pnpm build && pnpm tauri build` → Tauri Release (statisch) — **muss manuell gebaut werden**

## Provider-Architektur

`lib/providers.ts` — Einzige Quelle für Provider-Konfiguration:

```typescript
{
  id: "heypiggy",
  backendUrl: "http://localhost:8002",   // HeyPiggy Backend
  apiPrefix: "/api/v1",
  itemNoun: "Account",
  icon: PiggyBank,
  accent: "text-pink-500",
}
```

Jeder Provider hat eigenes `backendUrl` + `apiPrefix`. Das Dashboard (`useSinator` hook, `api.ts`) verwendet `${backendUrl}${apiPrefix}` für alle API-Calls.

## Backend URLs

| Provider | Backend URL | Repo |
|----------|------------|------|
| Fireworks AI | `http://localhost:8000` | SINator-fireworksai |
| HeyPiggy | `http://localhost:8002` | SINator-heypiggy |
| GitHub | `http://localhost:8000` | (shared) |
| Vercel | `http://localhost:8000` | (shared) |
| GMX | `http://localhost:8000` | (shared) |

## Dateien

- `lib/providers.ts` — Provider Registry (Backend URLs, Labels, Icons)
- `lib/api.ts` — API Client (`apiUrl(backendUrl, path)`, fetch wrapper)
- `hooks/use-sinator.ts` — Dashboard State (health, stats, browser)
- `components/provider-context.tsx` — Active Provider Context (localStorage)
- `components/provider-switcher.tsx` — Dropdown Menu für Provider-Wechsel
- `components/key-table.tsx` — `provider.itemNoun` für Labels
- `components/get-key-hero.tsx` — "Account/Key holen" Button
- `start.sh` — Startet Fireworks + HeyPiggy + Dashboard
- `build.sh` — Next.js export → Tauri build → /Applications installieren

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **SINator-dashboard** (960 symbols, 1835 relationships, 32 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/SINator-dashboard/context` | Codebase overview, check index freshness |
| `gitnexus://repo/SINator-dashboard/clusters` | All functional areas |
| `gitnexus://repo/SINator-dashboard/processes` | All execution flows |
| `gitnexus://repo/SINator-dashboard/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

## 🧠 Simone MCP — Code Intelligence & Automation

Simone MCP bietet zusätzliche Code-Analyse-Tools via MCP:

**Verfügbare Tools:**
- `sin_simone_mcp_symbol_search` — Symbol-Suche im gesamten Workspace
- `sin_simone_mcp_find_references` — Alle Referenzen zu einem Symbol finden
- `sin_simone_mcp_project_overview` — Workspace-Footprint + Dateitypen
- `sin_simone_mcp_structural_edit` — Strukturelle Code-Edits (LSP-grade)
- `sin_simone_mcp_memory_query` — Cloud Semantic Memory (Kontext + Analysen)
- `sin_simone_mcp_health` — Server-Status und Capabilities

**IMMER verwenden für:**
- `sin_simone_mcp_symbol_search` statt grep für Symbol-Suche
- `sin_simone_mcp_find_references` vor Refactoring
- `sin_simone_mcp_project_overview` für schnellen Codebase-Überblick
- `sin_simone_mcp_structural_edit` für sichere, strukturierte Edits
