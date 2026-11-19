use rusqlite::{Connection, OptionalExtension, Transaction};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::Path,
    sync::{Mutex, MutexGuard},
};

const INITIAL_MIGRATION: &str = include_str!("../migrations/001_initial.sql");
const INITIAL_MIGRATION_VERSION: i64 = 1;
const SETTINGS_KEY: &str = "preferences";

pub struct Database {
    connection: Mutex<Connection>,
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub language: String,
    pub audio_source: String,
    pub sample_rate: u32,
    pub buffer_size: u32,
    pub channel: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "pt-BR".to_owned(),
            audio_source: "reaper".to_owned(),
            sample_rate: 48_000,
            buffer_size: 256,
            channel: "stereo".to_owned(),
        }
    }
}

impl AppSettings {
    pub fn validate(&self) -> Result<(), String> {
        if !matches!(self.language.as_str(), "pt-BR" | "en") {
            return Err("Idioma não suportado.".to_owned());
        }
        if !matches!(self.audio_source.as_str(), "reaper" | "direct" | "virtual") {
            return Err("Origem de áudio inválida.".to_owned());
        }
        if !matches!(self.sample_rate, 44_100 | 48_000 | 96_000) {
            return Err("Taxa de amostragem não suportada.".to_owned());
        }
        if !matches!(self.buffer_size, 128 | 256 | 512 | 1024) {
            return Err("Tamanho de buffer não suportado.".to_owned());
        }
        if !matches!(self.channel.as_str(), "stereo" | "left" | "right") {
            return Err("Seleção de canal inválida.".to_owned());
        }
        Ok(())
    }
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                format!("Não foi possível criar a pasta de dados local: {error}")
            })?;
        }
        let connection = Connection::open(path)
            .map_err(|error| format!("Não foi possível abrir o banco SQLite local: {error}"))?;
        Self::from_connection(connection)
    }

    fn from_connection(mut connection: Connection) -> Result<Self, String> {
        connection
            .execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
            .map_err(|error| format!("Não foi possível configurar o banco SQLite: {error}"))?;
        connection
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );",
            )
            .map_err(|error| format!("Não foi possível preparar as migrações: {error}"))?;

        let migration_applied = connection
            .query_row(
                "SELECT 1 FROM schema_migrations WHERE version = ?1",
                [INITIAL_MIGRATION_VERSION],
                |_| Ok(()),
            )
            .optional()
            .map_err(|error| format!("Não foi possível consultar as migrações: {error}"))?
            .is_some();

        if !migration_applied {
            let transaction = connection
                .transaction()
                .map_err(|error| format!("Não foi possível iniciar a migração: {error}"))?;
            apply_initial_migration(&transaction)?;
            transaction
                .execute(
                    "INSERT INTO schema_migrations (version) VALUES (?1)",
                    [INITIAL_MIGRATION_VERSION],
                )
                .map_err(|error| format!("Não foi possível registrar a migração: {error}"))?;
            transaction
                .commit()
                .map_err(|error| format!("Não foi possível concluir a migração: {error}"))?;
        }

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn get_settings(&self) -> Result<AppSettings, String> {
        let connection = self.lock()?;
        let serialized = connection
            .query_row(
                "SELECT value FROM settings WHERE key = ?1",
                [SETTINGS_KEY],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|error| format!("Não foi possível ler as configurações locais: {error}"))?;

        match serialized {
            Some(value) => {
                let settings: AppSettings = serde_json::from_str(&value)
                    .map_err(|error| format!("As configurações locais estão inválidas: {error}"))?;
                settings.validate()?;
                Ok(settings)
            }
            None => Ok(AppSettings::default()),
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        settings.validate()?;
        let serialized = serde_json::to_string(settings)
            .map_err(|error| format!("Não foi possível serializar as configurações: {error}"))?;
        self.lock()?
            .execute(
                "INSERT INTO settings (key, value, updated_at)
                 VALUES (?1, ?2, CURRENT_TIMESTAMP)
                 ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = CURRENT_TIMESTAMP",
                (SETTINGS_KEY, serialized),
            )
            .map_err(|error| format!("Não foi possível salvar as configurações locais: {error}"))?;
        Ok(())
    }

    fn lock(&self) -> Result<MutexGuard<'_, Connection>, String> {
        self.connection
            .lock()
            .map_err(|_| "O acesso ao banco de dados ficou indisponível.".to_owned())
    }
}

fn apply_initial_migration(transaction: &Transaction<'_>) -> Result<(), String> {
    transaction
        .execute_batch(INITIAL_MIGRATION)
        .map_err(|error| format!("Não foi possível aplicar a migração inicial: {error}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initializes_migrations_once_and_loads_default_settings() {
        let database = Database::from_connection(Connection::open_in_memory().unwrap()).unwrap();

        assert_eq!(database.get_settings().unwrap(), AppSettings::default());

        let migrations = database
            .lock()
            .unwrap()
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get::<_, i64>(0)
            })
            .unwrap();
        assert_eq!(migrations, 1);
    }

    #[test]
    fn persists_settings_and_rejects_unsupported_values() {
        let database = Database::from_connection(Connection::open_in_memory().unwrap()).unwrap();
        let settings = AppSettings {
            sample_rate: 96_000,
            buffer_size: 512,
            ..AppSettings::default()
        };

        database.save_settings(&settings).unwrap();
        assert_eq!(database.get_settings().unwrap(), settings);

        let invalid = AppSettings {
            sample_rate: 12_345,
            ..AppSettings::default()
        };
        assert!(database.save_settings(&invalid).is_err());
    }
}
