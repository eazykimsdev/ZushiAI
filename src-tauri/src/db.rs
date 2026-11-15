use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub genre: String,
    pub notes: String,
    #[serde(rename = "styleReferenceImage")]
    pub style_reference_image: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunHistoryRecord {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: Option<String>,
    pub timestamp: String,
    #[serde(rename = "taskPrompt")]
    pub task_prompt: String,
    pub provider: String,
    pub model: String,
    #[serde(rename = "tokensInput")]
    pub tokens_input: i64,
    #[serde(rename = "tokensOutput")]
    pub tokens_output: i64,
    #[serde(rename = "estimatedCost")]
    pub estimated_cost: f64,
    pub status: String,
    #[serde(rename = "durationMs")]
    pub duration_ms: i64,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn init(app_data_dir: PathBuf) -> Result<Self, String> {
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        let db_path = app_data_dir.join("lihforge.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open SQLite database: {}", e))?;

        conn.execute_batch(
            r#"
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                genre TEXT NOT NULL,
                notes TEXT NOT NULL,
                style_reference_image TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS run_history (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                timestamp TEXT NOT NULL,
                task_prompt TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                tokens_input INTEGER NOT NULL,
                tokens_output INTEGER NOT NULL,
                estimated_cost REAL NOT NULL,
                status TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            );
            "#,
        )
        .map_err(|e| format!("Failed to initialize database schema: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn list_projects(&self) -> Result<Vec<Project>, String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        let mut stmt = conn
            .prepare(
                "SELECT id, name, genre, notes, style_reference_image, created_at, updated_at 
                 FROM projects ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    genre: row.get(2)?,
                    notes: row.get(3)?,
                    style_reference_image: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for item in rows {
            list.push(item.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    pub fn insert_project(&self, project: &Project) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        conn.execute(
            "INSERT INTO projects (id, name, genre, notes, style_reference_image, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                project.id,
                project.name,
                project.genre,
                project.notes,
                project.style_reference_image,
                project.created_at,
                project.updated_at,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_project(&self, project: &Project) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        conn.execute(
            "UPDATE projects SET name = ?1, genre = ?2, notes = ?3, style_reference_image = ?4, updated_at = ?5 
             WHERE id = ?6",
            params![
                project.name,
                project.genre,
                project.notes,
                project.style_reference_image,
                project.updated_at,
                project.id,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_project(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        let mut stmt = conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let val: String = row.get(0).map_err(|e| e.to_string())?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) 
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_all_settings(&self) -> Result<std::collections::HashMap<String, String>, String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        let mut stmt = conn
            .prepare("SELECT key, value FROM settings")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?;

        let mut map = std::collections::HashMap::new();
        for item in rows {
            let (k, v) = item.map_err(|e| e.to_string())?;
            map.insert(k, v);
        }
        Ok(map)
    }

    pub fn list_run_history(&self, project_id: Option<&str>) -> Result<Vec<RunHistoryRecord>, String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        let mut list = Vec::new();

        if let Some(pid) = project_id {
            let mut stmt = conn
                .prepare(
                    "SELECT id, project_id, timestamp, task_prompt, provider, model, tokens_input, 
                            tokens_output, estimated_cost, status, duration_ms 
                     FROM run_history WHERE project_id = ?1 ORDER BY timestamp DESC LIMIT 50",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(params![pid], |row| {
                    Ok(RunHistoryRecord {
                        id: row.get(0)?,
                        project_id: row.get(1)?,
                        timestamp: row.get(2)?,
                        task_prompt: row.get(3)?,
                        provider: row.get(4)?,
                        model: row.get(5)?,
                        tokens_input: row.get(6)?,
                        tokens_output: row.get(7)?,
                        estimated_cost: row.get(8)?,
                        status: row.get(9)?,
                        duration_ms: row.get(10)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            for item in rows {
                list.push(item.map_err(|e| e.to_string())?);
            }
        } else {
            let mut stmt = conn
                .prepare(
                    "SELECT id, project_id, timestamp, task_prompt, provider, model, tokens_input, 
                            tokens_output, estimated_cost, status, duration_ms 
                     FROM run_history ORDER BY timestamp DESC LIMIT 50",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(RunHistoryRecord {
                        id: row.get(0)?,
                        project_id: row.get(1)?,
                        timestamp: row.get(2)?,
                        task_prompt: row.get(3)?,
                        provider: row.get(4)?,
                        model: row.get(5)?,
                        tokens_input: row.get(6)?,
                        tokens_output: row.get(7)?,
                        estimated_cost: row.get(8)?,
                        status: row.get(9)?,
                        duration_ms: row.get(10)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            for item in rows {
                list.push(item.map_err(|e| e.to_string())?);
            }
        }
        Ok(list)
    }

    pub fn insert_run_history(&self, item: &RunHistoryRecord) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "DB lock poisoned")?;
        conn.execute(
            "INSERT INTO run_history (id, project_id, timestamp, task_prompt, provider, model, 
                                     tokens_input, tokens_output, estimated_cost, status, duration_ms) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                item.id,
                item.project_id,
                item.timestamp,
                item.task_prompt,
                item.provider,
                item.model,
                item.tokens_input,
                item.tokens_output,
                item.estimated_cost,
                item.status,
                item.duration_ms,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}
