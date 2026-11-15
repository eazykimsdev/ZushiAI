use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestKeyResponse {
    pub success: bool,
    pub message: String,
    #[serde(rename = "latencyMs")]
    pub latency_ms: Option<u64>,
    #[serde(rename = "availableModels")]
    pub available_models: Option<Vec<String>>,
}

pub async fn test_provider_key(
    provider: &str,
    api_key: &str,
    _model: &str,
) -> Result<TestKeyResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let start = Instant::now();

    match provider {
        "openrouter" => {
            let url = "https://openrouter.ai/api/v1/auth/key";
            let resp = client
                .get(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("HTTP-Referer", "https://lihforge.local")
                .header("X-Title", "LihForge Roblox Builder")
                .send()
                .await
                .map_err(|e| format!("Network request to OpenRouter failed: {}", e))?;

            let latency = start.elapsed().as_millis() as u64;
            let status = resp.status();

            if status.is_success() {
                let body: serde_json::Value = resp
                    .json()
                    .await
                    .map_err(|e| format!("Failed to parse response: {}", e))?;

                let label = body["data"]["label"].as_str().unwrap_or("Active Key");
                let usage = body["data"]["usage"].as_f64().unwrap_or(0.0);

                Ok(TestKeyResponse {
                    success: true,
                    message: format!(
                        "OpenRouter key verified! Label: \"{}\" | Usage: ${:.4} ({}ms)",
                        label, usage, latency
                    ),
                    latency_ms: Some(latency),
                    available_models: Some(vec![
                        "anthropic/claude-3.7-sonnet".to_string(),
                        "deepseek/deepseek-chat".to_string(),
                        "google/gemini-2.5-flash".to_string(),
                        "openai/gpt-4o".to_string(),
                    ]),
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                Ok(TestKeyResponse {
                    success: false,
                    message: format!(
                        "OpenRouter verification failed (HTTP {}): {}",
                        status.as_u16(),
                        clean_error_message(&err_text)
                    ),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            }
        }
        "gemini" => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models?key={}",
                api_key
            );
            let resp = client
                .get(&url)
                .send()
                .await
                .map_err(|e| format!("Network request to Google Gemini failed: {}", e))?;

            let latency = start.elapsed().as_millis() as u64;
            let status = resp.status();

            if status.is_success() {
                let body: serde_json::Value = resp
                    .json()
                    .await
                    .map_err(|e| format!("Failed to parse response: {}", e))?;

                let models = body["models"]
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|m| m["name"].as_str().map(|s| s.replace("models/", "")))
                            .collect::<Vec<String>>()
                    })
                    .unwrap_or_default();

                Ok(TestKeyResponse {
                    success: true,
                    message: format!(
                        "Google Gemini key verified successfully! ({}ms latency)",
                        latency
                    ),
                    latency_ms: Some(latency),
                    available_models: Some(models),
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                Ok(TestKeyResponse {
                    success: false,
                    message: format!(
                        "Verification failed (HTTP {}): {}",
                        status.as_u16(),
                        clean_error_message(&err_text)
                    ),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            }
        }
        "claude" => {
            let url = "https://api.anthropic.com/v1/models";
            let resp = client
                .get(url)
                .header("x-api-key", api_key)
                .header("anthropic-version", "2023-06-01")
                .send()
                .await
                .map_err(|e| format!("Network request to Claude failed: {}", e))?;

            let latency = start.elapsed().as_millis() as u64;
            let status = resp.status();

            if status.is_success() {
                Ok(TestKeyResponse {
                    success: true,
                    message: format!("Claude API key verified successfully! ({}ms)", latency),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                Ok(TestKeyResponse {
                    success: false,
                    message: format!(
                        "Verification failed (HTTP {}): {}",
                        status.as_u16(),
                        clean_error_message(&err_text)
                    ),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            }
        }
        "openai" => {
            let url = "https://api.openai.com/v1/models";
            let resp = client
                .get(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await
                .map_err(|e| format!("Network request to OpenAI failed: {}", e))?;

            let latency = start.elapsed().as_millis() as u64;
            let status = resp.status();

            if status.is_success() {
                Ok(TestKeyResponse {
                    success: true,
                    message: format!("OpenAI API key verified successfully! ({}ms)", latency),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                Ok(TestKeyResponse {
                    success: false,
                    message: format!(
                        "Verification failed (HTTP {}): {}",
                        status.as_u16(),
                        clean_error_message(&err_text)
                    ),
                    latency_ms: Some(latency),
                    available_models: None,
                })
            }
        }
        _ => Err(format!("Unsupported provider: {}", provider)),
    }
}

fn clean_error_message(raw: &str) -> String {
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(raw) {
        if let Some(msg) = val["error"]["message"].as_str() {
            return msg.to_string();
        }
        if let Some(msg) = val["message"].as_str() {
            return msg.to_string();
        }
    }
    let truncated = if raw.len() > 180 {
        &raw[..180]
    } else {
        raw
    };
    truncated.replace(['\r', '\n'], " ")
}
