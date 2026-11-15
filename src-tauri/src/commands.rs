use crate::ai_chat::{execute_ai_chat, AiChatResponse, ChatMessage};
use crate::ai_test::{test_provider_key, TestKeyResponse};
use crate::db::{DbState, Project, RunHistoryRecord};
use crate::keychain;
use chrono::Utc;
use std::collections::HashMap;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_projects(db: State<'_, DbState>) -> Result<Vec<Project>, String> {
    db.list_projects()
}

#[tauri::command]
pub fn create_project(
    name: String,
    genre: String,
    notes: String,
    style_reference_image: Option<String>,
    db: State<'_, DbState>,
) -> Result<Project, String> {
    let now = Utc::now().to_rfc3339();
    let project = Project {
        id: Uuid::new_v4().to_string(),
        name,
        genre,
        notes,
        style_reference_image,
        created_at: now.clone(),
        updated_at: now,
    };
    db.insert_project(&project)?;
    Ok(project)
}

#[tauri::command]
pub fn update_project(
    id: String,
    name: String,
    genre: String,
    notes: String,
    style_reference_image: Option<String>,
    db: State<'_, DbState>,
) -> Result<Project, String> {
    let now = Utc::now().to_rfc3339();
    let project = Project {
        id,
        name,
        genre,
        notes,
        style_reference_image,
        created_at: now.clone(),
        updated_at: now,
    };
    db.update_project(&project)?;
    Ok(project)
}

#[tauri::command]
pub fn delete_project(id: String, db: State<'_, DbState>) -> Result<(), String> {
    db.delete_project(&id)
}

#[tauri::command]
pub fn get_settings(db: State<'_, DbState>) -> Result<HashMap<String, String>, String> {
    db.get_all_settings()
}

#[tauri::command]
pub fn save_setting(key: String, value: String, db: State<'_, DbState>) -> Result<(), String> {
    db.set_setting(&key, &value)
}

#[tauri::command]
pub fn save_api_key(provider: String, api_key: String) -> Result<(), String> {
    keychain::save_api_key(&provider, &api_key)
}

#[tauri::command]
pub fn has_api_key(provider: String) -> Result<bool, String> {
    keychain::has_api_key(&provider)
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    keychain::delete_api_key(&provider)
}

#[tauri::command]
pub async fn fetch_provider_models(
    provider: String,
    custom_key: Option<String>,
) -> Result<Vec<crate::ai_test::LiveModelInfo>, String> {
    let key = if let Some(k) = custom_key {
        if !k.trim().is_empty() {
            Some(k)
        } else {
            None
        }
    } else {
        keychain::get_api_key(&provider).ok().flatten()
    };
    crate::ai_test::fetch_models_for_provider(&provider, key.as_deref()).await
}

#[tauri::command]
pub async fn test_api_key(
    provider: String,
    model: String,
    custom_key: Option<String>,
) -> Result<TestKeyResponse, String> {
    let key = if let Some(k) = custom_key {
        if k.trim().is_empty() {
            return Err("API key cannot be empty".to_string());
        }
        k
    } else {
        match keychain::get_api_key(&provider)? {
            Some(k) if !k.trim().is_empty() => k,
            _ => return Err(format!("No API key found in keychain for {}", provider)),
        }
    };

    test_provider_key(&provider, &key, &model).await
}

#[tauri::command]
pub async fn run_ai_chat(
    provider: String,
    model: String,
    system_prompt: String,
    messages: Vec<ChatMessage>,
    custom_key: Option<String>,
) -> Result<AiChatResponse, String> {
    execute_ai_chat(&provider, &model, &system_prompt, messages, custom_key).await
}

#[tauri::command]
pub fn get_run_history(
    project_id: Option<String>,
    db: State<'_, DbState>,
) -> Result<Vec<RunHistoryRecord>, String> {
    db.list_run_history(project_id.as_deref())
}

#[tauri::command]
pub fn record_run_history(
    project_id: Option<String>,
    task_prompt: String,
    provider: String,
    model: String,
    tokens_input: i64,
    tokens_output: i64,
    estimated_cost: f64,
    status: String,
    duration_ms: i64,
    db: State<'_, DbState>,
) -> Result<RunHistoryRecord, String> {
    let now = Utc::now().to_rfc3339();
    let record = RunHistoryRecord {
        id: Uuid::new_v4().to_string(),
        project_id,
        timestamp: now,
        task_prompt,
        provider,
        model,
        tokens_input,
        tokens_output,
        estimated_cost,
        status,
        duration_ms,
    };
    db.insert_run_history(&record)?;
    Ok(record)
}
