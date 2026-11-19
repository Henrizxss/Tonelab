mod commands;
mod database;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let database_path = app
                .path()
                .app_data_dir()
                .map_err(|error| std::io::Error::other(error.to_string()))?
                .join("tonelab.db");
            let database =
                database::Database::open(&database_path).map_err(std::io::Error::other)?;
            app.manage(database);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_runtime_status,
            commands::get_settings,
            commands::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
