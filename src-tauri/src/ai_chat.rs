use crate::keychain;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "user" | "assistant" | "system"
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatResponse {
    pub content: String,
    #[serde(rename = "tokensInput")]
    pub tokens_input: i64,
    #[serde(rename = "tokensOutput")]
    pub tokens_output: i64,
    #[serde(rename = "estimatedCost")]
    pub estimated_cost: f64,
    #[serde(rename = "durationMs")]
    pub duration_ms: i64,
    pub model: String,
    pub provider: String,
}

pub async fn execute_ai_chat(
    provider: &str,
    model: &str,
    system_prompt: &str,
    messages: Vec<ChatMessage>,
    custom_key: Option<String>,
) -> Result<AiChatResponse, String> {
    let key = if let Some(k) = custom_key {
        if k.trim().is_empty() {
            return Err("API key cannot be empty".to_string());
        }
        k
    } else {
        match keychain::get_api_key(provider)? {
            Some(k) if !k.trim().is_empty() => k,
            _ => return Err(format!("No API key found in keychain for {}. Please enter your key in Settings or in the chat.", provider)),
        }
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let start = Instant::now();

    match provider {
        "openrouter" => {
            let url = "https://openrouter.ai/api/v1/chat/completions";
            let mut formatted_msgs = Vec::new();
            formatted_msgs.push(serde_json::json!({
                "role": "system",
                "content": system_prompt
            }));

            for m in messages {
                formatted_msgs.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            let payload = serde_json::json!({
                "model": model,
                "messages": formatted_msgs,
                "temperature": 0.3
            });

            let resp = client
                .post(url)
                .header("Authorization", format!("Bearer {}", key))
                .header("HTTP-Referer", "https://lihforge.local")
                .header("X-Title", "LihForge Roblox Builder")
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("OpenRouter network request failed: {}", e))?;

            let status = resp.status();
            let duration_ms = start.elapsed().as_millis() as i64;

            if !status.is_success() {
                let err_text = resp.text().await.unwrap_or_default();
                let status_code = status.as_u16();
                let human_msg = match status_code {
                    401 => "Key rejected by OpenRouter. Please verify your API key.".to_string(),
                    402 => "Insufficient credits on OpenRouter. Please add funds.".to_string(),
                    404 => format!("This model ('{}') is no longer available. Pick another.", model),
                    429 => "Rate limit reached on OpenRouter. Please retry shortly.".to_string(),
                    _ => format!("OpenRouter error (HTTP {}): {}", status_code, clean_error_message(&err_text)),
                };
                return Err(format!("HTTP_{}:{}:{}", status_code, human_msg, err_text));
            }

            let body: serde_json::Value = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse OpenRouter response: {}", e))?;

            let text = body["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("No response content generated")
                .to_string();

            let prompt_tokens = body["usage"]["prompt_tokens"].as_i64().unwrap_or(300);
            let comp_tokens = body["usage"]["completion_tokens"].as_i64().unwrap_or(400);

            let cost = calculate_cost(model, prompt_tokens, comp_tokens);

            Ok(AiChatResponse {
                content: text,
                tokens_input: prompt_tokens,
                tokens_output: comp_tokens,
                estimated_cost: cost,
                duration_ms,
                model: model.to_string(),
                provider: provider.to_string(),
            })
        }
        "gemini" => {
            let clean_model = if model.starts_with("models/") {
                model.replace("models/", "")
            } else {
                model.to_string()
            };

            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                clean_model, key
            );

            let mut contents = Vec::new();
            for m in messages {
                let role = if m.role == "assistant" { "model" } else { "user" };
                contents.push(serde_json::json!({
                    "role": role,
                    "parts": [{ "text": m.content }]
                }));
            }

            let payload = serde_json::json!({
                "system_instruction": {
                    "parts": [{ "text": system_prompt }]
                },
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.3
                }
            });

            let resp = client
                .post(&url)
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("Gemini network request failed: {}", e))?;

            let status = resp.status();
            let duration_ms = start.elapsed().as_millis() as i64;

            if !status.is_success() {
                let err_text = resp.text().await.unwrap_or_default();
                let status_code = status.as_u16();
                let is_key_err = status_code == 400 && (err_text.contains("API_KEY_INVALID") || err_text.contains("key not valid") || err_text.contains("INVALID_ARGUMENT"));
                let human_msg = if is_key_err || status_code == 401 || status_code == 403 {
                    "Key rejected by Google Gemini. Please check your API key.".to_string()
                } else if status_code == 404 {
                    format!("This model ('{}') is no longer available. Pick another.", clean_model)
                } else if status_code == 429 {
                    "Rate limit reached on Google Gemini. Please retry shortly.".to_string()
                } else {
                    format!("Google Gemini error (HTTP {}): {}", status_code, clean_error_message(&err_text))
                };
                let effective_code = if is_key_err { 401 } else { status_code };
                return Err(format!("HTTP_{}:{}:{}", effective_code, human_msg, err_text));
            }

            let body: serde_json::Value = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

            let text = body["candidates"][0]["content"]["parts"][0]["text"]
                .as_str()
                .unwrap_or("No response generated")
                .to_string();

            let prompt_tokens = body["usageMetadata"]["promptTokenCount"].as_i64().unwrap_or(250);
            let comp_tokens = body["usageMetadata"]["candidatesTokenCount"].as_i64().unwrap_or(350);

            let cost = calculate_cost(model, prompt_tokens, comp_tokens);

            Ok(AiChatResponse {
                content: text,
                tokens_input: prompt_tokens,
                tokens_output: comp_tokens,
                estimated_cost: cost,
                duration_ms,
                model: model.to_string(),
                provider: provider.to_string(),
            })
        }
        "claude" => {
            let url = "https://api.anthropic.com/v1/messages";
            let mut formatted_msgs = Vec::new();
            for m in messages {
                if m.role == "user" || m.role == "assistant" {
                    formatted_msgs.push(serde_json::json!({
                        "role": m.role,
                        "content": m.content
                    }));
                }
            }

            let payload = serde_json::json!({
                "model": model,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": formatted_msgs,
                "temperature": 0.3
            });

            let resp = client
                .post(url)
                .header("x-api-key", key)
                .header("anthropic-version", "2023-06-01")
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("Claude network request failed: {}", e))?;

            let status = resp.status();
            let duration_ms = start.elapsed().as_millis() as i64;

            if !status.is_success() {
                let err_text = resp.text().await.unwrap_or_default();
                return Err(format!("Claude error (HTTP {}): {}", status.as_u16(), err_text));
            }

            let body: serde_json::Value = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

            let text = body["content"][0]["text"]
                .as_str()
                .unwrap_or("No response content generated")
                .to_string();

            let prompt_tokens = body["usage"]["input_tokens"].as_i64().unwrap_or(350);
            let comp_tokens = body["usage"]["output_tokens"].as_i64().unwrap_or(450);

            let cost = calculate_cost(model, prompt_tokens, comp_tokens);

            Ok(AiChatResponse {
                content: text,
                tokens_input: prompt_tokens,
                tokens_output: comp_tokens,
                estimated_cost: cost,
                duration_ms,
                model: model.to_string(),
                provider: provider.to_string(),
            })
        }
        "openai" => {
            let url = "https://api.openai.com/v1/chat/completions";
            let mut formatted_msgs = Vec::new();
            formatted_msgs.push(serde_json::json!({
                "role": "system",
                "content": system_prompt
            }));

            for m in messages {
                formatted_msgs.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            let payload = serde_json::json!({
                "model": model,
                "messages": formatted_msgs,
                "temperature": 0.3
            });

            let resp = client
                .post(url)
                .header("Authorization", format!("Bearer {}", key))
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("OpenAI network request failed: {}", e))?;

            let status = resp.status();
            let duration_ms = start.elapsed().as_millis() as i64;

            if !status.is_success() {
                let err_text = resp.text().await.unwrap_or_default();
                return Err(format!("OpenAI error (HTTP {}): {}", status.as_u16(), err_text));
            }

            let body: serde_json::Value = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

            let text = body["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("No response content generated")
                .to_string();

            let prompt_tokens = body["usage"]["prompt_tokens"].as_i64().unwrap_or(300);
            let comp_tokens = body["usage"]["completion_tokens"].as_i64().unwrap_or(400);

            let cost = calculate_cost(model, prompt_tokens, comp_tokens);

            Ok(AiChatResponse {
                content: text,
                tokens_input: prompt_tokens,
                tokens_output: comp_tokens,
                estimated_cost: cost,
                duration_ms,
                model: model.to_string(),
                provider: provider.to_string(),
            })
        }
        _ => Err(format!("Unsupported provider: {}", provider)),
    }
}

fn calculate_cost(model: &str, input_tokens: i64, output_tokens: i64) -> f64 {
    let (rate_in, rate_out) = match model {
        m if m.contains("claude-3.7") || m.contains("claude-3-7") => (3.00, 15.00),
        m if m.contains("deepseek") => (0.27, 1.10),
        m if m.contains("flash") => (0.15, 0.60),
        m if m.contains("pro") => (1.25, 5.00),
        m if m.contains("gpt-4o-mini") => (0.15, 0.60),
        m if m.contains("gpt-4o") => (2.50, 10.00),
        _ => (1.00, 3.00),
    };

    let in_cost = (input_tokens as f64 / 1_000_000.0) * rate_in;
    let out_cost = (output_tokens as f64 / 1_000_000.0) * rate_out;
    ((in_cost + out_cost) * 100_000.0).round() / 100_000.0
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
