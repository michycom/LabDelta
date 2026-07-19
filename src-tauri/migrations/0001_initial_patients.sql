CREATE TABLE patients (
    id TEXT PRIMARY KEY NOT NULL,
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
    date_of_birth TEXT NOT NULL,
    sex_reference_context TEXT,
    external_identifier TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
