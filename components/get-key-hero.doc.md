# components/get-key-hero.tsx

Dashboard-Hero-Komponente: Haupt-Button für Key-Bezug. "Holen" least aus Pool, "Generieren" öffnet Terminal via Tauri invoke.

## Berührt

- `lib/api.ts` — `revealKey()`, `RotationResult` type
- `lib/key-history.ts` — `addToHistory()`
- `src-tauri/src/lib.rs` — `open_terminal_rotate` Tauri Command
- `components/provider-context.tsx` — Provider-Auswahl
- `components/usage-snippet.tsx` — Code-Snippets nach Key-Erhalt

## Holen (handleClick)

- `GET {backend}/pool-lease?leased_to=dashboard-{ts}` → `api_key`
- Pool leer → "Nutze den Generieren-Button" Toast (KEIN Fallback auf Rotation!)
- Multi-Key: Loop `doLeaseMulti(n)` → `POST /pool/lease`

## Generieren (handleGenerate → openTerminal)

- Prüft `localStorage` auf gespeichertes Passwort
- Kein Passwort → Password-Dialog (`setPwOpen(true)`)
- `invoke("open_terminal_rotate", { password, count })`
- **Kein `setPhase("running")`!** → Toast "Terminal geöffnet", idle bleiben
- Terminal-Fenster führt `python3 tools/rotate.py` aus, Key landet via `--save` im Pool

## Config / Limits

- **MAX_KEYS:** 100
- **Passwort-Storage:** `localStorage["sinator.password.fireworks"]`
- **Tastatur:** `R` = Holen, `C` = Key kopieren
- **Onboarding:** Nur bei `available === 0` und erstem Besuch

## Anti-Patterns / Banned

- `setPhase("running")` im `openTerminal()` — zeigt endlose Ladeanimation ohne Exit-Pfad!
- `startRotation()` direkt im Frontend — nicht mehr für Generieren verwendet
- `runRotations()` — gelöscht, war nur für API-Endpoint-basierte Rotation
- Kein `useEffect` der `openTerminal` triggert — Terminal nur per User-Klick!
