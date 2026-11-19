CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE presets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    source_path TEXT,
    checksum TEXT,
    favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preset_versions (
    id INTEGER PRIMARY KEY,
    preset_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    file_path TEXT NOT NULL,
    change_summary TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (preset_id, version_number),
    FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
);

CREATE TABLE audio_analyses (
    id INTEGER PRIMARY KEY,
    file_path TEXT,
    device_name TEXT,
    sample_rate INTEGER,
    rms REAL,
    peak REAL,
    crest_factor REAL,
    dynamic_range REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_models (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT,
    quantization TEXT,
    memory_required_mb INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_profiles (
    id INTEGER PRIMARY KEY,
    device_name TEXT NOT NULL,
    vendor_id INTEGER,
    product_id INTEGER,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
