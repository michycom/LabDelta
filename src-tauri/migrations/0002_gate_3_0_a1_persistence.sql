ALTER TABLE patients
ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0
CHECK(is_archived IN (0, 1));

ALTER TABLE patients
ADD COLUMN archived_at TEXT;

CREATE TRIGGER patients_archive_consistency_insert
BEFORE INSERT ON patients
WHEN (NEW.is_archived = 0 AND NEW.archived_at IS NOT NULL)
  OR (NEW.is_archived = 1 AND NEW.archived_at IS NULL)
BEGIN
    SELECT RAISE(ABORT, 'patient archive state and timestamp must agree');
END;

CREATE TRIGGER patients_archive_consistency_update
BEFORE UPDATE OF is_archived, archived_at ON patients
WHEN (NEW.is_archived = 0 AND NEW.archived_at IS NOT NULL)
  OR (NEW.is_archived = 1 AND NEW.archived_at IS NULL)
BEGIN
    SELECT RAISE(ABORT, 'patient archive state and timestamp must agree');
END;

CREATE TABLE laboratory_reports (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    patient_id TEXT NOT NULL,
    laboratory_name TEXT,
    specimen_collected_at TEXT,
    laboratory_received_at TEXT,
    report_released_at TEXT,
    revision_number TEXT,
    imported_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX laboratory_reports_patient_idx
ON laboratory_reports(patient_id);

CREATE TABLE original_documents (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    report_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(length(trim(source_type)) > 0),
    original_file_name TEXT NOT NULL CHECK(length(trim(original_file_name)) > 0),
    media_type TEXT,
    checksum_algorithm TEXT NOT NULL CHECK(length(trim(checksum_algorithm)) > 0),
    content_checksum TEXT NOT NULL CHECK(length(trim(content_checksum)) > 0),
    storage_path TEXT NOT NULL CHECK(length(trim(storage_path)) > 0),
    byte_size INTEGER CHECK(byte_size IS NULL OR byte_size >= 0),
    recorded_at TEXT NOT NULL,
    UNIQUE (id, report_id),
    UNIQUE (report_id, checksum_algorithm, content_checksum),
    FOREIGN KEY (report_id) REFERENCES laboratory_reports(id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX original_documents_report_idx
ON original_documents(report_id);

CREATE TRIGGER original_documents_immutable_update
BEFORE UPDATE ON original_documents
BEGIN
    SELECT RAISE(ABORT, 'original document metadata is immutable');
END;

CREATE TABLE provenance_locations (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    report_id TEXT NOT NULL,
    original_document_id TEXT NOT NULL,
    locator_kind TEXT NOT NULL CHECK(length(trim(locator_kind)) > 0),
    page_number INTEGER CHECK(page_number IS NULL OR page_number > 0),
    row_number INTEGER CHECK(row_number IS NULL OR row_number > 0),
    column_name TEXT,
    json_path TEXT,
    text_start_offset INTEGER CHECK(text_start_offset IS NULL OR text_start_offset >= 0),
    text_end_offset INTEGER CHECK(
        text_end_offset IS NULL
        OR (text_start_offset IS NOT NULL AND text_end_offset >= text_start_offset)
    ),
    bounding_box_json TEXT,
    text_excerpt TEXT,
    recorded_at TEXT NOT NULL,
    UNIQUE (id, original_document_id, report_id),
    FOREIGN KEY (original_document_id, report_id)
        REFERENCES original_documents(id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX provenance_locations_document_idx
ON provenance_locations(original_document_id);

CREATE TRIGGER provenance_locations_immutable_update
BEFORE UPDATE ON provenance_locations
BEGIN
    SELECT RAISE(ABORT, 'provenance locations are immutable');
END;

CREATE TABLE original_values (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    report_id TEXT NOT NULL,
    original_document_id TEXT NOT NULL,
    provenance_location_id TEXT NOT NULL,
    source_parameter_name TEXT NOT NULL CHECK(length(trim(source_parameter_name)) > 0),
    original_value_text TEXT NOT NULL CHECK(length(trim(original_value_text)) > 0),
    original_unit TEXT,
    original_reference_text TEXT,
    original_flag TEXT,
    original_material TEXT,
    original_method TEXT,
    recorded_at TEXT NOT NULL,
    UNIQUE (id, original_document_id, report_id),
    FOREIGN KEY (original_document_id, report_id)
        REFERENCES original_documents(id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (provenance_location_id, original_document_id, report_id)
        REFERENCES provenance_locations(id, original_document_id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX original_values_report_idx
ON original_values(report_id);

CREATE INDEX original_values_document_idx
ON original_values(original_document_id);

CREATE TRIGGER original_values_immutable_update
BEFORE UPDATE ON original_values
BEGIN
    SELECT RAISE(ABORT, 'original values are immutable');
END;

CREATE TABLE extraction_versions (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    report_id TEXT NOT NULL,
    original_document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL CHECK(version_number > 0),
    extractor_id TEXT NOT NULL CHECK(length(trim(extractor_id)) > 0),
    extractor_version TEXT NOT NULL CHECK(length(trim(extractor_version)) > 0),
    extracted_at TEXT NOT NULL,
    UNIQUE (original_document_id, version_number),
    UNIQUE (id, original_document_id, report_id),
    FOREIGN KEY (original_document_id, report_id)
        REFERENCES original_documents(id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX extraction_versions_document_idx
ON extraction_versions(original_document_id);

CREATE TRIGGER extraction_versions_immutable_update
BEFORE UPDATE ON extraction_versions
BEGIN
    SELECT RAISE(ABORT, 'extraction versions are immutable');
END;

CREATE TABLE extracted_values (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    report_id TEXT NOT NULL,
    original_document_id TEXT NOT NULL,
    extraction_version_id TEXT NOT NULL,
    original_value_id TEXT NOT NULL,
    extracted_parameter_name TEXT NOT NULL CHECK(length(trim(extracted_parameter_name)) > 0),
    numeric_value_text TEXT,
    text_value TEXT,
    extracted_unit TEXT,
    reference_lower_text TEXT,
    reference_upper_text TEXT,
    reference_rule_text TEXT,
    extracted_flag TEXT,
    extracted_material TEXT,
    extracted_method TEXT,
    confidence_value TEXT,
    confidence_scheme TEXT,
    recorded_at TEXT NOT NULL,
    CHECK(
        (numeric_value_text IS NOT NULL AND text_value IS NULL)
        OR (numeric_value_text IS NULL AND text_value IS NOT NULL)
    ),
    CHECK(
        (confidence_value IS NULL AND confidence_scheme IS NULL)
        OR (confidence_value IS NOT NULL AND confidence_scheme IS NOT NULL)
    ),
    UNIQUE (extraction_version_id, original_value_id),
    UNIQUE (id, original_value_id),
    FOREIGN KEY (extraction_version_id, original_document_id, report_id)
        REFERENCES extraction_versions(id, original_document_id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (original_value_id, original_document_id, report_id)
        REFERENCES original_values(id, original_document_id, report_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX extracted_values_extraction_idx
ON extracted_values(extraction_version_id);

CREATE INDEX extracted_values_original_idx
ON extracted_values(original_value_id);

CREATE TRIGGER extracted_values_immutable_update
BEFORE UPDATE ON extracted_values
BEGIN
    SELECT RAISE(ABORT, 'extracted value versions are immutable');
END;

CREATE TABLE confirmed_working_values (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    original_value_id TEXT NOT NULL,
    extracted_value_id TEXT NOT NULL,
    version_number INTEGER NOT NULL CHECK(version_number > 0),
    parameter_name TEXT NOT NULL CHECK(length(trim(parameter_name)) > 0),
    numeric_value_text TEXT,
    text_value TEXT,
    unit TEXT,
    reference_lower_text TEXT,
    reference_upper_text TEXT,
    reference_rule_text TEXT,
    supplied_flag TEXT,
    material TEXT,
    method TEXT,
    confirmation_kind TEXT NOT NULL CHECK(confirmation_kind = 'explicit'),
    confirmed_at TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    CHECK(
        (numeric_value_text IS NOT NULL AND text_value IS NULL)
        OR (numeric_value_text IS NULL AND text_value IS NOT NULL)
    ),
    UNIQUE (original_value_id, version_number),
    UNIQUE (id, original_value_id),
    FOREIGN KEY (extracted_value_id, original_value_id)
        REFERENCES extracted_values(id, original_value_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX confirmed_working_values_original_idx
ON confirmed_working_values(original_value_id);

CREATE INDEX confirmed_working_values_extracted_idx
ON confirmed_working_values(extracted_value_id);

CREATE TRIGGER confirmed_working_values_immutable_update
BEFORE UPDATE ON confirmed_working_values
BEGIN
    SELECT RAISE(ABORT, 'confirmed working value versions are immutable');
END;

CREATE TABLE correction_history (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    original_value_id TEXT NOT NULL,
    previous_extracted_value_id TEXT,
    previous_working_value_id TEXT,
    new_working_value_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL CHECK(sequence_number > 0),
    field_name TEXT NOT NULL CHECK(length(trim(field_name)) > 0),
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT NOT NULL,
    reason TEXT,
    CHECK(
        (previous_extracted_value_id IS NOT NULL AND previous_working_value_id IS NULL)
        OR (previous_extracted_value_id IS NULL AND previous_working_value_id IS NOT NULL)
    ),
    CHECK(previous_working_value_id IS NULL OR previous_working_value_id <> new_working_value_id),
    CHECK(old_value IS NOT new_value),
    UNIQUE (original_value_id, sequence_number),
    UNIQUE (new_working_value_id, field_name),
    FOREIGN KEY (previous_extracted_value_id, original_value_id)
        REFERENCES extracted_values(id, original_value_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (previous_working_value_id, original_value_id)
        REFERENCES confirmed_working_values(id, original_value_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (new_working_value_id, original_value_id)
        REFERENCES confirmed_working_values(id, original_value_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE INDEX correction_history_original_idx
ON correction_history(original_value_id);

CREATE TRIGGER correction_history_immutable_update
BEFORE UPDATE ON correction_history
BEGIN
    SELECT RAISE(ABORT, 'correction history is append-only');
END;

CREATE TRIGGER correction_history_append_only_delete
BEFORE DELETE ON correction_history
WHEN EXISTS (
    SELECT 1
    FROM original_values AS value
    JOIN original_documents AS document
        ON document.id = value.original_document_id
    JOIN laboratory_reports AS report
        ON report.id = document.report_id
    JOIN patients AS patient
        ON patient.id = report.patient_id
    WHERE value.id = OLD.original_value_id
)
BEGIN
    SELECT RAISE(ABORT, 'correction history is append-only');
END;

CREATE TRIGGER correction_history_version_order_insert
BEFORE INSERT ON correction_history
WHEN NEW.previous_working_value_id IS NOT NULL
AND (
    SELECT version_number
    FROM confirmed_working_values
    WHERE id = NEW.new_working_value_id
) <= (
    SELECT version_number
    FROM confirmed_working_values
    WHERE id = NEW.previous_working_value_id
)
BEGIN
    SELECT RAISE(ABORT, 'correction must point to a newer working value version');
END;
