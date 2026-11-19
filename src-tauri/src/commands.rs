use serde::Serialize;
use tauri::State;

use crate::database::{AppSettings, Database};

#[derive(Debug, Serialize)]
pub struct RuntimeStatus {
    pub desktop_available: bool,
    pub gp200: &'static str,
    pub audio_input: &'static str,
    pub reaper: &'static str,
    pub ai_runtime: &'static str,
}

#[tauri::command]
pub fn get_runtime_status() -> RuntimeStatus {
    RuntimeStatus {
        desktop_available: true,
        gp200: "Não detectado",
        audio_input: "Não configurado",
        reaper: "Não configurado",
        ai_runtime: "Desligado",
    }
}

#[tauri::command]
pub fn get_settings(database: State<'_, Database>) -> Result<AppSettings, String> {
    database.get_settings()
}

#[tauri::command]
pub fn save_settings(database: State<'_, Database>, settings: AppSettings) -> Result<(), String> {
    database.save_settings(&settings)
}
