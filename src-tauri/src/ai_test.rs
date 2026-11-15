use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveModelInfo {
    pub id: String,
    pub name: String,
    #[serde(rename = "contextLength")]
    pub context_length: Option<u64>,
    #[serde(rename = "costPerMillionInput")]
    pub cost_per_million_input: Option<f64>,
    #[serde(rename = "costPerMillionOutput")]
    pub cost_per_million_output: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestKeyResponse {
    pub success: bool,
    pub message: String,
    #[serde(rename = "rawError")]
    pub raw_error: Option<String>,
    #[serde(rename = "errorCode")]
    pub error_code: Option<u16>,
    #[serde(rename = "latencyMs")]
    pub latency_ms: Option<u64>,
    #[serde(rename = "availableModels")]
    pub available_models: Option<Vec<LiveModelInfo>>,
    #[serde(rename = "suggestedModel")]
    pub suggested_model: Option<String>,
}

pub async fn fetch_models_for_provider(
    provider: &str,
    api_key: Option<&str>,
) -> Result<Vec<LiveModelInfo>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    match provider {
        "openrouter" => {
            let mut req = client.get("https://openrouter.ai/api/v1/models")
                .header("HTTP-Referer", "https://zushiai.local")
                .header("X-Title", "ZushiAI Roblox Builder");
            if let Some(key) = api_key {
                if !key.trim().is_empty() {
                    req = req.header("Authorization", format!("Bearer {}", key.trim()));
                }
            }
            let resp = req.send().await.map_err(|e| format!("Failed to reach OpenRouter: {}", e))?;
            if !resp.status().is_success() {
                return Err(format!("OpenRouter models list returned HTTP {}", resp.status().as_u16()));
            }
            let body: serde_json::Value = resp.json().await.map_err(|e| format!("Failed to parse JSON: {}", e))?;
            let mut list = Vec::new();
            if let Some(arr) = body["data"].as_array() {
                for item in arr {
                    if let Some(id) = item["id"].as_str() {
                        let name = item["name"].as_str().unwrap_or(id).to_string();
                        let ctx = item["context_length"].as_u64();
                        let desc = item["description"].as_str().map(|s| s.to_string());
                        let prompt_rate = item["pricing"]["prompt"].as_str().and_then(|s| s.parse::<f64>().ok());
                        let comp_rate = item["pricing"]["completion"].as_str().and_then(|s| s.parse::<f64>().ok());
                        
                        list.push(LiveModelInfo {
                            id: id.to_string(),
                            name,
                            context_length: ctx,
                            cost_per_million_input: prompt_rate.map(|r| r * 1_000_000.0),
                            cost_per_million_output: comp_rate.map(|r| r * 1_000_000.0),
                            description: desc,
                        });
                    }
                }
            }
            Ok(list)
        }
        "gemini" => {
            let key = match api_key {
                Some(k) if !k.trim().is_empty() => k.trim(),
                _ => return Err("Google Gemini requires an API key to list models".to_string()),
            };
            let url = format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", key);
            let resp = client.get(&url).send().await.map_err(|e| format!("Failed to reach Gemini: {}", e))?;
            if !resp.status().is_success() {
                return Err(format!("Google Gemini models list returned HTTP {}", resp.status().as_u16()));
            }
            let body: serde_json::Value = resp.json().await.map_err(|e| format!("Failed to parse JSON: {}", e))?;
            let mut list = Vec::new();
            if let Some(arr) = body["models"].as_array() {
                for item in arr {
                    if let Some(raw_name) = item["name"].as_str() {
                        let id = raw_name.replace("models/", "");
                        let supported_methods = item["supportedGenerationMethods"].as_array();
                        let supports_gen = supported_methods.map_or(true, |methods| {
                            methods.iter().any(|m| m.as_str() == Some("generateContent"))
                        });
                        if !supports_gen {
                            continue;
                        }
                        let name = item["displayName"].as_str().unwrap_or(&id).to_string();
                        let ctx = item["inputTokenLimit"].as_u64();
                        let desc = item["description"].as_str().map(|s| s.to_string());
                        list.push(LiveModelInfo {
                            id,
                            name,
                            context_length: ctx,
                            cost_per_million_input: None,
                            cost_per_million_output: None,
                            description: desc,
                        });
                    }
                }
            }
            Ok(list)
        }
        _ => Err(format!("Unsupported provider for listing models: {}", provider)),
    }
}

pub async fn test_provider_key(
    provider: &str,
    api_key: &str,
    model: &str,
) -> Result<TestKeyResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let start = Instant::now();

    match provider {
        "openrouter" => {
            let url = "https://openrouter.ai/api/v1/chat/completions";
            let payload = serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1
            });

            let resp = client
                .post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("HTTP-Referer", "https://zushiai.local")
                .header("X-Title", "ZushiAI Roblox Builder")
                .json(&payload)
                .send()
                .await;

            let latency = start.elapsed().as_millis() as u64;

            let resp = match resp {
                Ok(r) => r,
                Err(e) => {
                    return Ok(TestKeyResponse {
                        success: false,
                        message: "Network error or provider unreachable".to_string(),
                        raw_error: Some(e.to_string()),
                        error_code: None,
                        latency_ms: Some(latency),
                        available_models: None,
                        suggested_model: None,
                    });
                }
            };

            let status = resp.status();
            let status_code = status.as_u16();

            if status.is_success() {
                let models = fetch_models_for_provider("openrouter", Some(api_key)).await.ok();
                Ok(TestKeyResponse {
                    success: true,
                    message: format!("Key connected and model verified! ({}ms)", latency),
                    raw_error: None,
                    error_code: Some(status_code),
                    latency_ms: Some(latency),
                    available_models: models,
                    suggested_model: None,
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                let clean_msg = clean_error_message(&err_text);

                let mut suggested = None;
                let models = fetch_models_for_provider("openrouter", Some(api_key)).await.ok();
                if status_code == 404 {
                    if let Some(ref m_list) = models {
                        suggested = m_list
                            .iter()
                            .find(|m| m.id.contains("claude") || m.id.contains("deepseek") || m.id.contains("gemini"))
                            .map(|m| m.id.clone());
                    }
                }

                let human_msg = match status_code {
                    401 => "Key rejected by OpenRouter. Please verify your API key.".to_string(),
                    402 => "Insufficient credits on OpenRouter. Please add funds.".to_string(),
                    404 => format!("This model ('{}') is no longer available. Pick another.", model),
                    429 => "Rate limit reached on OpenRouter. Please retry shortly.".to_string(),
                    _ => format!("OpenRouter verification failed (HTTP {}): {}", status_code, clean_msg),
                };

                Ok(TestKeyResponse {
                    success: false,
                    message: human_msg,
                    raw_error: Some(err_text),
                    error_code: Some(status_code),
                    latency_ms: Some(latency),
                    available_models: models,
                    suggested_model: suggested,
                })
            }
        }
        "gemini" => {
            let clean_model = if model.starts_with("models/") {
                model.replace("models/", "")
            } else {
                model.to_string()
            };

            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                clean_model, api_key
            );

            let payload = serde_json::json!({
                "contents": [{"parts": [{"text": "ping"}]}],
                "generationConfig": {"maxOutputTokens": 1}
            });

            let resp = client.post(&url).json(&payload).send().await;
            let latency = start.elapsed().as_millis() as u64;

            let resp = match resp {
                Ok(r) => r,
                Err(e) => {
                    return Ok(TestKeyResponse {
                        success: false,
                        message: "Network error or provider unreachable".to_string(),
                        raw_error: Some(e.to_string()),
                        error_code: None,
                        latency_ms: Some(latency),
                        available_models: None,
                        suggested_model: None,
                    });
                }
            };

            let status = resp.status();
            let status_code = status.as_u16();

            if status.is_success() {
                let models = fetch_models_for_provider("gemini", Some(api_key)).await.ok();
                Ok(TestKeyResponse {
                    success: true,
                    message: format!("Google Gemini key and model verified! ({}ms latency)", latency),
                    raw_error: None,
                    error_code: Some(status_code),
                    latency_ms: Some(latency),
                    available_models: models,
                    suggested_model: None,
                })
            } else {
                let err_text = resp.text().await.unwrap_or_default();
                let clean_msg = clean_error_message(&err_text);

                let is_key_err = status_code == 400 && (err_text.contains("API_KEY_INVALID") || err_text.contains("key not valid") || err_text.contains("INVALID_ARGUMENT"));

                let human_msg = if is_key_err || status_code == 401 || status_code == 403 {
                    "Key rejected by Google Gemini. Please check your API key.".to_string()
                } else if status_code == 404 {
                    format!("This model ('{}') is no longer available. Pick another.", clean_model)
                } else if status_code == 429 {
                    "Rate limit reached on Google Gemini. Please retry shortly.".to_string()
                } else {
                    format!("Google Gemini verification failed (HTTP {}): {}", status_code, clean_msg)
                };

                let models = fetch_models_for_provider("gemini", Some(api_key)).await.ok();
                let suggested = if status_code == 404 {
                    models.as_ref().and_then(|m_list| m_list.first().map(|m| m.id.clone()))
                } else {
                    None
                };

                Ok(TestKeyResponse {
                    success: false,
                    message: human_msg,
                    raw_error: Some(err_text),
                    error_code: Some(if is_key_err { 401 } else { status_code }),
                    latency_ms: Some(latency),
                    available_models: models,
                    suggested_model: suggested,
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
