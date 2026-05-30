# src-tauri/src/lib.rs

Tauri v2 Rust Commands: Chat-Assistent via Pool-Proxy, Live-Pool-Stats im System-Prompt. Clipboard-Manager für Key-Copy. Statischer Export (kein Hot-Reload).

## Berührt

- `src-tauri/chat-system-prompt.txt` — System-Prompt für Chat (include_str!)
- `components/chat-panel.tsx` — Frontend ruft `invoke("chat_send", { message })`
- `lib/api.ts` — Pool-Stats werden hier auch in Rust geholt (nicht shared mit TS)

## Commands

| Command | Zweck |
|---------|-------|
| `chat_send(message)` | Chat-Message an Pool-Proxy senden (gpt-oss-120b) |

## Config / Limits

- **Proxy URL:** `http://localhost:9998/inference/v1/chat/completions`
- **Model:** `accounts/fireworks/models/gpt-oss-120b`
- **Auth:** `Bearer pool` (Proxy ignoriert Auth für lokale Requests)
- **max_tokens:** 1024
- **Fallback:** `reasoning_content` wenn `content` leer

## Wichtige Entscheidungen

- **Rust Command statt Frontend-Fetch:** Tauri WebView blockiert `fetch()` zu localhost → Rust macht HTTP-Call
- **Live-Context-Injektion:** `fetch_live_context()` holt Pool-Stats + Backend-Health → in System-Prompt
- **Statischer Export:** `output: "export"` → Kein Server-Rendering → Nach Build KEIN Hot-Reload
- **Clipboard Plugin:** `tauri_plugin_clipboard_manager` für Key-Copy
- **Debug-Logging:** `tauri_plugin_log` nur in Debug-Build

## Build

```bash
cd ~/dev/SINator-dashboard && ./build.sh
# → Next.js Static Export → Tauri Release Build → /Applications/SINator.app
```

⚠️ Nach JEDER Code-Änderung muss `./build.sh` laufen — die `.app` ist statisch!
