use std::fs;
use std::path::PathBuf;

use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager};

const DATABASE_FILE_NAME: &str = "workspace.sqlite";
const PRIMARY_SNAPSHOT_KEY: &str = "primary";

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data directory: {error}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| format!("failed to create app data directory: {error}"))?;

    Ok(app_data_dir.join(DATABASE_FILE_NAME))
}

fn open_workspace_database(app: &AppHandle) -> Result<Connection, String> {
    let path = database_path(app)?;
    let connection = Connection::open(path)
        .map_err(|error| format!("failed to open workspace database: {error}"))?;

    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| format!("failed to enable write-ahead logging: {error}"))?;

    connection
        .execute_batch(
            "
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS schema_migrations (
              version INTEGER PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS workspace_snapshots (
              snapshot_key TEXT PRIMARY KEY NOT NULL,
              workspace_json TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);
            ",
        )
        .map_err(|error| format!("failed to initialize workspace schema: {error}"))?;

    Ok(connection)
}

#[tauri::command]
pub fn load_workspace_snapshot(app: AppHandle) -> Result<Option<String>, String> {
    let connection = open_workspace_database(&app)?;

    connection
        .query_row(
            "SELECT workspace_json FROM workspace_snapshots WHERE snapshot_key = ?1",
            params![PRIMARY_SNAPSHOT_KEY],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("failed to load workspace snapshot: {error}"))
}

#[tauri::command]
pub fn save_workspace_snapshot(app: AppHandle, workspace_json: String) -> Result<(), String> {
    serde_json::from_str::<serde_json::Value>(&workspace_json)
        .map_err(|error| format!("workspace payload is not valid JSON: {error}"))?;

    let connection = open_workspace_database(&app)?;

    connection
        .execute(
            "
            INSERT INTO workspace_snapshots (snapshot_key, workspace_json)
            VALUES (?1, ?2)
            ON CONFLICT(snapshot_key) DO UPDATE SET
              workspace_json = excluded.workspace_json,
              updated_at = CURRENT_TIMESTAMP
            ",
            params![PRIMARY_SNAPSHOT_KEY, workspace_json],
        )
        .map_err(|error| format!("failed to save workspace snapshot: {error}"))?;

    Ok(())
}
