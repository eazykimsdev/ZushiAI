pub mod ai_chat;
pub mod ai_test;
pub mod commands;
pub mod db;
pub mod keychain;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| dirs::data_dir().unwrap_or_default().join("com.lihforge.app"));
            
            let db_state = db::DbState::init(app_data_dir)
                .expect("failed to initialize SQLite database");
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_projects,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::get_settings,
            commands::save_setting,
            commands::save_api_key,
            commands::has_api_key,
            commands::delete_api_key,
            commands::fetch_provider_models,
            commands::test_api_key,
            commands::run_ai_chat,
            commands::get_run_history,
            commands::record_run_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
