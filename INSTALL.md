# SINator Dashboard — Installation

*Tauri v2 Desktop App + Next.js 16 Frontend. Prozedurale Schritt-für-Schritt-Anleitung.*

---

## 1. Voraussetzungen

### 1.1 Node.js v22+

```bash
node --version
# ✅ "v22.x.x" oder höher
# ❌ "command not found" → `brew install node`
```

### 1.2 pnpm

```bash
pnpm --version
# ✅ Zeigt Version an
# ❌ "command not found" → `npm install -g pnpm`
```

### 1.3 Rust (für Tauri)

```bash
rustc --version
# ✅ "rustc 1.77.x" oder höher
# ❌ → `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
```

### 1.4 Xcode Command Line Tools

```bash
xcode-select --version
# ✅ "xcode-select version 2406" oder ähnlich
# ❌ → `xcode-select --install`
```

### 1.5 Backend-Repos (müssen existieren)

```bash
ls ~/dev/SINator-fireworksai/agent_toolbox/start_toolbox.py
# ✅ Datei existiert
# ❌ → `git clone <url> ~/dev/SINator-fireworksai`

ls ~/dev/SINator-heypiggy/agent_toolbox/start_toolbox.py
# ✅ Datei existiert
# ❌ → `git clone <url> ~/dev/SINator-heypiggy`
```

---

## 2. Repository klonen

```bash
cd ~/dev
git clone git@github.com:SIN-Rotator/SINator-dashboard.git
cd SINator-dashboard

# ✅ Du bist jetzt im Ordner ~/dev/SINator-dashboard
```

---

## 3. Dependencies installieren

```bash
pnpm install
# ✅ "Done in Xs" — alle Frontend-Deps installiert
# ❌ Fehler → Node.js Version prüfen (Schritt 1.1)
```

```bash
# Tauri CLI ist als devDependency enthalten — muss nicht global installiert werden
pnpm tauri --version
# ✅ "@tauri-apps/cli 2.x.x"
```

---

## 4. Backend starten (`:8000`, `:8002`)

Das Dashboard braucht beide Backends:

```bash
# Terminal 2: Fireworks Backend
cd ~/dev/SINator-fireworksai
python3 agent_toolbox/start_toolbox.py
# → http://localhost:8000

# Terminal 3: HeyPiggy Backend
cd ~/dev/SINator-heypiggy
python3 agent_toolbox/start_toolbox.py
# → http://localhost:8002
```

**Verifikation:**

```bash
curl http://localhost:8000/health
# ✅ {"server":"ok",...}

curl http://localhost:8002/health
# ✅ {"status":"ok",...}
```

---

## 5. Dashboard starten (Development)

```bash
pnpm dev
# → http://localhost:3000
# ✅ "ready - started server on http://localhost:3000"
```

**Verifikation im Browser:**
- http://localhost:3000 öffnen
- ✅ Dashboard lädt mit Pool-Statistiken
- ❌ "Connection refused" → Backends laufen nicht (Schritt 4)

---

## 6. Tauri Desktop App starten (Development mit Hot-Reload)

```bash
pnpm tauri dev
# → Öffnet nativen macOS-Fenster mit dem Dashboard
# ✅ Tauri-Fenster zeigt das Dashboard an
# ❌ Build-Fehler → Rust-Toolchain prüfen (Schritt 1.3)
```

---

## 7. Production Build

```bash
./build.sh
# 1. pnpm build → Next.js static export nach ./out/
# 2. pnpm tauri build → Tauri .app Bundle
# 3. Kopiert nach /Applications/SINator.app
# ✅ /Applications/SINator.app existiert
```

---

## 8. Full Stack starten (ein Befehl)

```bash
./start.sh
# Startet Fireworks (:8000) + HeyPiggy (:8002) + Dashboard (:3000) + Tauri
```

**Was `start.sh` macht:**
1. Killt alte Prozesse auf `:8000`, `:8002`, `:3000`
2. Startet `SINator-fireworksai` Backend via `nohup`
3. Startet `SINator-heypiggy` Backend via `nohup`
4. Startet `pnpm dev` auf `:3000`
5. Wartet bis alle 3 Services HTTP 200 returnen
6. Öffnet `http://localhost:3000` im Browser
7. Startet `pnpm tauri dev`

---

## 9. Verifikation — alles läuft?

```bash
python3 -c "
import urllib.request, json

ok, fail = [], []
checks = [
    ('Dashboard :3000', 'http://localhost:3000', lambda r: len(r) > 0),
    ('Fireworks :8000', 'http://localhost:8000/health', lambda r: 'ok' in r),
    ('HeyPiggy :8002', 'http://localhost:8002/health', lambda r: 'ok' in r),
]
for name, url, check in checks:
    try:
        r = urllib.request.urlopen(url, timeout=5).read().decode()
        ok.append(name) if check(r) else fail.append(f'{name} — unexpected response')
    except Exception as e:
        fail.append(f'{name} — {e}')

print('✅ Alles OK' if not fail else '❌ Fehler:')
for m in ok: print(f'  ✅ {m}')
for m in fail: print(f'  ❌ {m}')
"

# ✅ Alles OK
#   ✅ Dashboard :3000
#   ✅ Fireworks :8000
#   ✅ HeyPiggy :8002
```

---

## 10. Fehlerbehebung

| Problem | Ursache | Lösung |
|---------|---------|--------|
| `pnpm install` fehlschlägt | Node.js zu alt | `node --version` muss v22+ |
| Tauri Build Error: `linker not found` | Xcode CLT fehlt | `xcode-select --install` |
| `Module not found: Can't resolve '...'` | Frontend-Deps fehlen | `rm -rf node_modules && pnpm install` |
| Backend `:8000` nicht erreichbar | SINator-fireworksai läuft nicht | `tail -20 /tmp/sinator-backend.log` |
| Backend `:8002` nicht erreichbar | SINator-heypiggy läuft nicht | `tail -20 /tmp/heypiggy-backend.log` |
| Tauri Fenster bleibt weiß | Next.js Build fehlgeschlagen | `pnpm build` Logs prüfen |
| `start.sh` startet nicht | Falscher Python-Pfad | `which python3` muss `/opt/homebrew/bin/python3` sein |

---

*Stand: 2026-05-31 | Tauri v2 | Next.js 16 | pnpm*
