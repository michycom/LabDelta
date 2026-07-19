CREATE TABLE demo_seed_runs (
    seed_version TEXT PRIMARY KEY NOT NULL CHECK(length(trim(seed_version)) > 0),
    manifest_version TEXT NOT NULL CHECK(length(trim(manifest_version)) > 0),
    manifest_sha256 TEXT NOT NULL CHECK(length(manifest_sha256) = 64),
    demo_marker TEXT NOT NULL CHECK(length(trim(demo_marker)) > 0),
    applied_at TEXT NOT NULL
);

CREATE TABLE demo_seed_fixtures (
    seed_version TEXT NOT NULL,
    fixture_id TEXT NOT NULL CHECK(length(trim(fixture_id)) > 0),
    fixture_version TEXT NOT NULL CHECK(length(trim(fixture_version)) > 0),
    demo_marker TEXT NOT NULL CHECK(length(trim(demo_marker)) > 0),
    content_sha256 TEXT NOT NULL CHECK(length(content_sha256) = 64),
    source_path TEXT NOT NULL CHECK(length(trim(source_path)) > 0),
    PRIMARY KEY (seed_version, fixture_id),
    UNIQUE (seed_version, source_path),
    FOREIGN KEY (seed_version) REFERENCES demo_seed_runs(seed_version)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE demo_seed_documents (
    seed_version TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    original_document_id TEXT NOT NULL,
    PRIMARY KEY (seed_version, original_document_id),
    UNIQUE (original_document_id),
    FOREIGN KEY (seed_version, fixture_id)
        REFERENCES demo_seed_fixtures(seed_version, fixture_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (original_document_id) REFERENCES original_documents(id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX demo_seed_documents_fixture_idx
ON demo_seed_documents(seed_version, fixture_id);
