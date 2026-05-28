use serde::Serialize;

const PROXY_URL: &str = "http://localhost:9998/inference/v1/chat/completions";
const MODEL: &str = "accounts/fireworks/models/gpt-oss-120b";
const SYSTEM_PROMPT: &str = include_str!("../chat-system-prompt.txt");

#[derive(Serialize)]
struct ChatResponse {
    content: String,
    reasoning_ms: u64,
}

#[tauri::command]
async fn chat_send(message: String) -> Result<ChatResponse, String> {
    let client = reqwest::Client::new();
    let system_prompt = build_system_prompt().await;

    let body = serde_json::json!({
        "model": MODEL,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": message }
        ],
        "max_tokens": 1024
    });

    let t0 = std::time::Instant::now();

    let res = client
        .post(PROXY_URL)
        .header("Authorization", "Bearer pool")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Proxy-Fehler: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("API-Fehler {}: {}", status, &text[..text.len().min(200)]));
    }

    let data: serde_json::Value = res.json().await.map_err(|e| format!("Parse: {}", e))?;

    let msg = data.get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .ok_or("No message in response")?;

    let content = msg.get("content")
        .and_then(|c| c.as_str())
        .or_else(|| msg.get("reasoning_content").and_then(|c| c.as_str()))
        .unwrap_or("(keine Antwort)")
        .to_string();

    let reasoning_ms = t0.elapsed().as_millis() as u64;

    Ok(ChatResponse { content, reasoning_ms })
}

async fn build_system_prompt() -> String {
    let mut prompt = SYSTEM_PROMPT.to_string();
    prompt.push_str(&fetch_live_context().await);
    prompt
}

async fn fetch_live_context() -> String {
    let client = reqwest::Client::new();
    let mut ctx = String::from("\n== LIVE-STATUS (jetzt) ==\n");

    match client.get("http://localhost:8000/api/v1/pool/stats").send().await {
        Ok(res) if res.status().is_success() => {
            if let Ok(data) = res.json::<serde_json::Value>().await {
                let a = data.get("available").and_then(|v| v.as_i64()).unwrap_or(0);
                let t = data.get("total").and_then(|v| v.as_i64()).unwrap_or(0);
                let u = data.get("used").and_then(|v| v.as_i64()).unwrap_or(0);
                let s = data.get("suspended").and_then(|v| v.as_i64()).unwrap_or(0);
                ctx.push_str(&format!("Pool: {} verfuegbar / {} gesamt / {} verbraucht / {} gesperrt\n", a, t, u, s));
            }
        }
        _ => ctx.push_str("Pool: Offline\n"),
    }

    match client.get("http://localhost:8000/health").send().await {
        Ok(res) if res.status().is_success() => {
            if let Ok(data) = res.json::<serde_json::Value>().await {
                let ch = data.get("chrome").and_then(|v| v.as_bool()).unwrap_or(false);
                let cu = data.get("cua").and_then(|v| v.as_bool()).unwrap_or(false);
                ctx.push_str(&format!("Backend: Online | Chrome: {} | CUA: {}\n",
                    if ch { "laeuft" } else { "aus" },
                    if cu { "laeuft" } else { "aus" }));
            }
        }
        _ => ctx.push_str("Backend: Offline\n"),
    }

    ctx
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![chat_send])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}