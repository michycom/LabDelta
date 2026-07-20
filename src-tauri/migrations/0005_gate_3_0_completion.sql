ALTER TABLE laboratory_reports ADD COLUMN report_version INTEGER NOT NULL DEFAULT 1 CHECK(report_version > 0);
ALTER TABLE laboratory_reports ADD COLUMN fixture_id TEXT;
ALTER TABLE laboratory_reports ADD COLUMN fixture_version TEXT;
ALTER TABLE laboratory_reports ADD COLUMN demo_marker TEXT;
ALTER TABLE laboratory_reports ADD COLUMN verified_checksum TEXT;
ALTER TABLE laboratory_reports ADD COLUMN extracted_identity_json TEXT;
ALTER TABLE laboratory_reports ADD COLUMN identity_match_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK(identity_match_status IN ('unconfirmed', 'confirmed', 'mismatch', 'ambiguous'));
ALTER TABLE laboratory_reports ADD COLUMN identity_manually_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(identity_manually_confirmed IN (0, 1));

CREATE TABLE patient_body_measurements (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    patient_id TEXT NOT NULL,
    measurement_kind TEXT NOT NULL CHECK(measurement_kind IN ('height', 'weight')),
    measured_at TEXT NOT NULL CHECK(length(trim(measured_at)) > 0),
    original_value_text TEXT NOT NULL CHECK(length(trim(original_value_text)) > 0),
    original_unit TEXT NOT NULL CHECK(length(trim(original_unit)) > 0),
    verification_status TEXT NOT NULL CHECK(verification_status IN ('unconfirmed', 'explicit')),
    original_value_id TEXT,
    provenance_location_id TEXT,
    recorded_at TEXT NOT NULL,
    CHECK(
        (original_value_id IS NULL AND provenance_location_id IS NULL)
        OR (original_value_id IS NOT NULL AND provenance_location_id IS NOT NULL)
    ),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (original_value_id) REFERENCES original_values(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (provenance_location_id) REFERENCES provenance_locations(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX patient_body_measurements_patient_time_idx
ON patient_body_measurements(patient_id, measured_at, id);
