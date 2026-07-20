use std::path::Path;
use std::time::Duration;

#[cfg(test)]
use chrono::{SecondsFormat, Utc};
use rusqlite::Connection;
#[cfg(test)]
use rusqlite::{params, Row};
#[cfg(test)]
use uuid::Uuid;

use crate::domain::PatientError;
#[cfg(test)]
use crate::domain::{Patient, PatientInput};
use crate::migrations;

pub struct PatientRepository {
    connection: Connection,
}

impl PatientRepository {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PatientError> {
        let connection = Connection::open(path).map_err(persistence_error)?;
        Self::from_connection(connection)
    }

    #[cfg(test)]
    pub(crate) fn in_memory() -> Result<Self, PatientError> {
        let connection = Connection::open_in_memory().map_err(persistence_error)?;
        Self::from_connection(connection)
    }

    fn from_connection(mut connection: Connection) -> Result<Self, PatientError> {
        connection
            .busy_timeout(Duration::from_secs(5))
            .map_err(persistence_error)?;
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .map_err(persistence_error)?;
        let foreign_keys_enabled = connection
            .query_row("PRAGMA foreign_keys", [], |row| row.get::<_, bool>(0))
            .map_err(persistence_error)?;
        if !foreign_keys_enabled {
            return Err(PatientError::Persistence(
                "SQLite foreign-key enforcement could not be enabled".to_owned(),
            ));
        }
        migrations::apply(&mut connection)?;
        Ok(Self { connection })
    }

    #[cfg(test)]
    pub fn list(&self) -> Result<Vec<Patient>, PatientError> {
        let mut statement = self
            .connection
            .prepare(
                "SELECT id, display_name, date_of_birth, sex_reference_context,
                        external_identifier, created_at, updated_at,
                        is_archived, archived_at
                 FROM patients
                 ORDER BY display_name COLLATE NOCASE, id",
            )
            .map_err(persistence_error)?;
        let patients = statement
            .query_map([], patient_from_row)
            .map_err(persistence_error)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(persistence_error)?;
        Ok(patients)
    }

    #[cfg(test)]
    pub fn create(&mut self, input: PatientInput) -> Result<Patient, PatientError> {
        let input = input.validate()?;
        let id = Uuid::new_v4().to_string();
        let now = timestamp();
        self.connection
            .execute(
                "INSERT INTO patients (
                    id, display_name, date_of_birth, sex_reference_context,
                    external_identifier, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
                params![
                    id,
                    input.display_name,
                    input.date_of_birth,
                    input.sex_reference_context,
                    input.external_identifier,
                    now,
                ],
            )
            .map_err(persistence_error)?;
        self.get(&id)
    }

    #[cfg(test)]
    pub fn update(&mut self, id: &str, input: PatientInput) -> Result<Patient, PatientError> {
        let input = input.validate()?;
        let updated = self
            .connection
            .execute(
                "UPDATE patients
                 SET display_name = ?2, date_of_birth = ?3,
                     sex_reference_context = ?4, external_identifier = ?5,
                     updated_at = ?6
                 WHERE id = ?1",
                params![
                    id,
                    input.display_name,
                    input.date_of_birth,
                    input.sex_reference_context,
                    input.external_identifier,
                    timestamp(),
                ],
            )
            .map_err(persistence_error)?;
        if updated == 0 {
            return Err(PatientError::NotFound(id.to_owned()));
        }
        self.get(id)
    }

    #[cfg(test)]
    pub fn delete(&mut self, id: &str) -> Result<(), PatientError> {
        let deleted = self
            .connection
            .execute("DELETE FROM patients WHERE id = ?1", [id])
            .map_err(persistence_error)?;
        if deleted == 0 {
            return Err(PatientError::NotFound(id.to_owned()));
        }
        Ok(())
    }

    #[cfg(test)]
    fn get(&self, id: &str) -> Result<Patient, PatientError> {
        self.connection
            .query_row(
                "SELECT id, display_name, date_of_birth, sex_reference_context,
                        external_identifier, created_at, updated_at,
                        is_archived, archived_at
                 FROM patients WHERE id = ?1",
                [id],
                patient_from_row,
            )
            .map_err(|error| match error {
                rusqlite::Error::QueryReturnedNoRows => PatientError::NotFound(id.to_owned()),
                other => persistence_error(other),
            })
    }

    pub(crate) fn connection(&self) -> &Connection {
        &self.connection
    }

    pub(crate) fn connection_mut(&mut self) -> &mut Connection {
        &mut self.connection
    }

    #[cfg(test)]
    fn schema_version(&self) -> i64 {
        self.connection
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .expect("schema version")
    }
}

#[cfg(test)]
fn patient_from_row(row: &Row<'_>) -> rusqlite::Result<Patient> {
    Ok(Patient {
        id: row.get(0)?,
        display_name: row.get(1)?,
        date_of_birth: row.get(2)?,
        sex_reference_context: row.get(3)?,
        external_identifier: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        is_archived: row.get(7)?,
        archived_at: row.get(8)?,
    })
}

#[cfg(test)]
fn timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn persistence_error(error: rusqlite::Error) -> PatientError {
    PatientError::Persistence(error.to_string())
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use rusqlite::{params, Connection};
    use tempfile::tempdir;

    use super::PatientRepository;
    use crate::domain::{PatientError, PatientInput};
    use crate::migrations::LATEST_SCHEMA_VERSION;

    const PERSISTENCE_TABLES: [&str; 24] = [
        "analysis_contract_input_refs",
        "analysis_contract_rule_refs",
        "analysis_contracts",
        "confirmed_working_values",
        "correction_history",
        "demo_seed_documents",
        "demo_seed_fixtures",
        "demo_seed_runs",
        "extracted_values",
        "extraction_versions",
        "laboratory_parameters",
        "laboratory_profiles",
        "laboratory_reports",
        "measurement_units",
        "original_documents",
        "original_values",
        "parameter_external_codes",
        "parameter_names",
        "patients",
        "profile_memberships",
        "provenance_locations",
        "rule_definitions",
        "schema_migrations",
        "unit_conversion_rules",
    ];

    fn input(name: &str, birth_date: &str) -> PatientInput {
        PatientInput {
            display_name: name.to_owned(),
            date_of_birth: birth_date.to_owned(),
            sex_reference_context: Some("female".to_owned()),
            external_identifier: None,
        }
    }

    fn create_version_one_database(path: &Path) {
        let connection = Connection::open(path).expect("open version 1 database");
        connection
            .execute_batch(
                "CREATE TABLE schema_migrations (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                 );
                 CREATE TABLE patients (
                    id TEXT PRIMARY KEY NOT NULL,
                    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
                    date_of_birth TEXT NOT NULL,
                    sex_reference_context TEXT,
                    external_identifier TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                 );
                 INSERT INTO schema_migrations(version, applied_at)
                 VALUES (1, '2026-07-19T00:00:00.000Z');",
            )
            .expect("create version 1 schema");
        connection
            .execute(
                "INSERT INTO patients (
                    id, display_name, date_of_birth, sex_reference_context,
                    external_identifier, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "legacy-patient-1",
                    "Mara Legacy",
                    "1984-06-12",
                    "female",
                    "LEGACY-001",
                    "2026-07-19T00:01:00.000Z",
                    "2026-07-19T00:02:00.000Z",
                ],
            )
            .expect("insert version 1 patient");
    }

    fn table_names(connection: &Connection) -> Vec<String> {
        let mut statement = connection
            .prepare(
                "SELECT name
                 FROM sqlite_master
                 WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                 ORDER BY name",
            )
            .expect("prepare table list");
        statement
            .query_map([], |row| row.get(0))
            .expect("query table list")
            .collect::<Result<Vec<_>, _>>()
            .expect("collect table list")
    }

    fn row_count(connection: &Connection, table: &str) -> i64 {
        let query = format!("SELECT COUNT(*) FROM {table}");
        connection
            .query_row(&query, [], |row| row.get(0))
            .expect("table row count")
    }

    fn assert_no_foreign_key_violations(connection: &Connection) {
        let mut statement = connection
            .prepare("PRAGMA foreign_key_check")
            .expect("prepare foreign key check");
        let mut rows = statement.query([]).expect("run foreign key check");
        assert!(rows.next().expect("foreign key result").is_none());
    }

    fn insert_persistence_graph(connection: &Connection, patient_id: &str) {
        connection
            .execute(
                "INSERT INTO laboratory_reports (
                    id, patient_id, laboratory_name, specimen_collected_at,
                    laboratory_received_at, report_released_at, revision_number,
                    imported_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    "report-1",
                    patient_id,
                    "Synthetic Laboratory",
                    "2026-01-10T08:00:00Z",
                    "2026-01-10T09:00:00Z",
                    "2026-01-10T12:00:00Z",
                    "1",
                    "2026-01-11T10:00:00Z",
                ],
            )
            .expect("insert report");
        connection
            .execute(
                "INSERT INTO original_documents (
                    id, report_id, source_type, original_file_name, media_type,
                    checksum_algorithm, content_checksum, storage_path,
                    byte_size, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    "document-1",
                    "report-1",
                    "synthetic-test",
                    "synthetic-report.txt",
                    "text/plain",
                    "test-checksum",
                    "document-checksum-1",
                    "sources/document-1.txt",
                    128_i64,
                    "2026-01-11T10:00:00Z",
                ],
            )
            .expect("insert original document");
        connection
            .execute(
                "INSERT INTO provenance_locations (
                    id, report_id, original_document_id, locator_kind,
                    page_number, text_excerpt, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "location-1",
                    "report-1",
                    "document-1",
                    "page",
                    1_i64,
                    "Synthetic parameter 4.6 mg/l",
                    "2026-01-11T10:00:00Z",
                ],
            )
            .expect("insert provenance location");
        connection
            .execute(
                "INSERT INTO original_values (
                    id, report_id, original_document_id, provenance_location_id,
                    source_parameter_name, original_value_text, original_unit,
                    original_reference_text, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    "original-value-1",
                    "report-1",
                    "document-1",
                    "location-1",
                    "Synthetic parameter",
                    "4.6",
                    "mg/l",
                    "< 5.0",
                    "2026-01-11T10:00:00Z",
                ],
            )
            .expect("insert original value");
        connection
            .execute(
                "INSERT INTO extraction_versions (
                    id, report_id, original_document_id, version_number,
                    extractor_id, extractor_version, extracted_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "extraction-1",
                    "report-1",
                    "document-1",
                    1_i64,
                    "test-extractor",
                    "1",
                    "2026-01-11T10:01:00Z",
                ],
            )
            .expect("insert extraction version");
        connection
            .execute(
                "INSERT INTO extracted_values (
                    id, report_id, original_document_id, extraction_version_id,
                    original_value_id, extracted_parameter_name,
                    numeric_value_text, extracted_unit, confidence_value,
                    confidence_scheme, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    "extracted-value-1",
                    "report-1",
                    "document-1",
                    "extraction-1",
                    "original-value-1",
                    "Synthetic parameter",
                    "4.6",
                    "mg/l",
                    "high",
                    "test-only",
                    "2026-01-11T10:01:00Z",
                ],
            )
            .expect("insert extracted value");
        connection
            .execute(
                "INSERT INTO confirmed_working_values (
                    id, original_value_id, extracted_value_id, version_number,
                    parameter_name, numeric_value_text, unit,
                    confirmation_kind, confirmed_at, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'explicit', ?8, ?9)",
                params![
                    "working-value-1",
                    "original-value-1",
                    "extracted-value-1",
                    1_i64,
                    "Synthetic parameter",
                    "4.7",
                    "mg/l",
                    "2026-01-11T10:02:00Z",
                    "2026-01-11T10:02:00Z",
                ],
            )
            .expect("insert first confirmed working value");
        connection
            .execute(
                "INSERT INTO confirmed_working_values (
                    id, original_value_id, extracted_value_id, version_number,
                    parameter_name, numeric_value_text, unit,
                    confirmation_kind, confirmed_at, recorded_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'explicit', ?8, ?9)",
                params![
                    "working-value-2",
                    "original-value-1",
                    "extracted-value-1",
                    2_i64,
                    "Synthetic parameter",
                    "4.8",
                    "mg/l",
                    "2026-01-11T10:03:00Z",
                    "2026-01-11T10:03:00Z",
                ],
            )
            .expect("insert corrected confirmed working value");
        connection
            .execute(
                "INSERT INTO correction_history (
                    id, original_value_id, previous_extracted_value_id,
                    new_working_value_id, sequence_number, field_name,
                    old_value, new_value, changed_at, reason
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    "correction-1",
                    "original-value-1",
                    "extracted-value-1",
                    "working-value-1",
                    1_i64,
                    "numeric_value_text",
                    "4.6",
                    "4.7",
                    "2026-01-11T10:02:00Z",
                    "Synthetic correction",
                ],
            )
            .expect("insert correction from extracted value");
        connection
            .execute(
                "INSERT INTO correction_history (
                    id, original_value_id, previous_working_value_id,
                    new_working_value_id, sequence_number, field_name,
                    old_value, new_value, changed_at, reason
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    "correction-2",
                    "original-value-1",
                    "working-value-1",
                    "working-value-2",
                    2_i64,
                    "numeric_value_text",
                    "4.7",
                    "4.8",
                    "2026-01-11T10:04:00Z",
                    "Synthetic follow-up correction",
                ],
            )
            .expect("insert correction from working value");
    }

    #[test]
    fn creates_latest_schema_for_a_new_database() {
        let repository = PatientRepository::in_memory().expect("new database");

        assert_eq!(repository.schema_version(), LATEST_SCHEMA_VERSION);
        assert_eq!(table_names(repository.connection()), PERSISTENCE_TABLES);
        assert_no_foreign_key_violations(repository.connection());
    }

    #[test]
    fn migrates_version_one_without_changing_patient_data_or_id() {
        let directory = tempdir().expect("temporary directory");
        let database_path = directory.path().join("version-one.sqlite3");
        create_version_one_database(&database_path);

        let repository = PatientRepository::open(&database_path).expect("migrate database");
        let patients = repository.list().expect("migrated patients");

        assert_eq!(repository.schema_version(), LATEST_SCHEMA_VERSION);
        assert_eq!(patients.len(), 1);
        let patient = &patients[0];
        assert_eq!(patient.id, "legacy-patient-1");
        assert_eq!(patient.display_name, "Mara Legacy");
        assert_eq!(patient.date_of_birth, "1984-06-12");
        assert_eq!(patient.sex_reference_context.as_deref(), Some("female"));
        assert_eq!(patient.external_identifier.as_deref(), Some("LEGACY-001"));
        assert_eq!(patient.created_at, "2026-07-19T00:01:00.000Z");
        assert_eq!(patient.updated_at, "2026-07-19T00:02:00.000Z");
        assert!(!patient.is_archived);
        assert_eq!(patient.archived_at, None);
    }

    #[test]
    fn enforces_foreign_keys_and_cascades_the_complete_patient_graph() {
        let mut repository = PatientRepository::in_memory().expect("in-memory repository");
        assert!(repository
            .connection()
            .execute(
                "INSERT INTO laboratory_reports(id, patient_id, imported_at)
                 VALUES ('orphan-report', 'missing-patient', '2026-01-01T00:00:00Z')",
                [],
            )
            .is_err());

        let patient = repository
            .create(input("Mara Example", "1984-06-12"))
            .expect("create patient");
        insert_persistence_graph(repository.connection(), &patient.id);
        assert_no_foreign_key_violations(repository.connection());

        repository
            .delete(&patient.id)
            .expect("delete patient graph");
        for table in PERSISTENCE_TABLES
            .iter()
            .copied()
            .filter(|table| !matches!(*table, "schema_migrations" | "patients"))
        {
            assert_eq!(row_count(repository.connection(), table), 0, "{table}");
        }
        assert_no_foreign_key_violations(repository.connection());
    }

    #[test]
    fn reopening_an_already_migrated_database_is_idempotent() {
        let directory = tempdir().expect("temporary directory");
        let database_path = directory.path().join("reopen.sqlite3");
        let patient_id = {
            let mut repository =
                PatientRepository::open(&database_path).expect("first database open");
            repository
                .create(input("Mara Example", "1984-06-12"))
                .expect("create persistent patient")
                .id
        };

        for _ in 0..3 {
            let repository =
                PatientRepository::open(&database_path).expect("reopen migrated database");
            assert_eq!(repository.schema_version(), LATEST_SCHEMA_VERSION);
            assert_eq!(
                repository.list().expect("persisted patients")[0].id,
                patient_id
            );
        }
    }

    #[test]
    fn catalog_schema_is_empty_versioned_and_referentially_safe() {
        let directory = tempdir().expect("temporary directory");
        let database_path = directory.path().join("catalog.sqlite3");
        {
            let repository =
                PatientRepository::open(&database_path).expect("open catalog database");
            for table in [
                "rule_definitions",
                "laboratory_parameters",
                "parameter_names",
                "parameter_external_codes",
                "measurement_units",
                "unit_conversion_rules",
                "laboratory_profiles",
                "profile_memberships",
                "analysis_contracts",
            ] {
                assert_eq!(row_count(repository.connection(), table), 0, "{table}");
            }

            repository
                .connection()
                .execute(
                    "INSERT INTO laboratory_parameters (
                        id, version, canonical_display, status, source
                     ) VALUES ('parameter-demo', 1, 'Synthetic parameter', 'draft', 'contest test')",
                    [],
                )
                .expect("insert first parameter version");
            repository
                .connection()
                .execute(
                    "INSERT INTO laboratory_parameters (
                        id, version, canonical_display, status, source
                     ) VALUES ('parameter-demo', 2, 'Synthetic parameter v2', 'draft', 'contest test')",
                    [],
                )
                .expect("insert second parameter version");
            repository
                .connection()
                .execute(
                    "INSERT INTO parameter_names (
                        parameter_id, parameter_version, name, name_kind, source
                     ) VALUES ('parameter-demo', 2, 'Synthetic alias', 'alias', 'contest test')",
                    [],
                )
                .expect("insert parameter alias");
            assert!(repository
                .connection()
                .execute(
                    "INSERT INTO parameter_names (
                        parameter_id, parameter_version, name, name_kind, source
                     ) VALUES ('missing', 1, 'Orphan alias', 'alias', 'contest test')",
                    [],
                )
                .is_err());
            assert_no_foreign_key_violations(repository.connection());
        }

        let reopened = PatientRepository::open(&database_path).expect("reopen catalog database");
        assert_eq!(row_count(reopened.connection(), "laboratory_parameters"), 2);
        assert_eq!(row_count(reopened.connection(), "parameter_names"), 1);
        assert_no_foreign_key_violations(reopened.connection());
    }

    #[test]
    fn immutable_versions_reject_updates_and_automatic_confirmation() {
        let mut repository = PatientRepository::in_memory().expect("in-memory repository");
        let patient = repository
            .create(input("Mara Example", "1984-06-12"))
            .expect("create patient");
        insert_persistence_graph(repository.connection(), &patient.id);

        for statement in [
            "UPDATE original_documents SET original_file_name = 'changed' WHERE id = 'document-1'",
            "UPDATE provenance_locations SET page_number = 2 WHERE id = 'location-1'",
            "UPDATE original_values SET original_value_text = '9.9' WHERE id = 'original-value-1'",
            "UPDATE extraction_versions SET extractor_version = '2' WHERE id = 'extraction-1'",
            "UPDATE extracted_values SET numeric_value_text = '9.9' WHERE id = 'extracted-value-1'",
            "UPDATE confirmed_working_values SET numeric_value_text = '9.9' WHERE id = 'working-value-1'",
            "UPDATE correction_history SET reason = 'changed' WHERE id = 'correction-1'",
            "DELETE FROM correction_history WHERE id = 'correction-1'",
        ] {
            assert!(repository.connection().execute(statement, []).is_err());
        }

        assert!(repository
            .connection()
            .execute(
                "INSERT INTO confirmed_working_values (
                    id, original_value_id, extracted_value_id, version_number,
                    parameter_name, numeric_value_text, confirmation_kind,
                    confirmed_at, recorded_at
                 ) VALUES (
                    'automatic-working-value', 'original-value-1',
                    'extracted-value-1', 3, 'Synthetic parameter', '4.8',
                    'automatic', '2026-01-11T10:04:00Z',
                    '2026-01-11T10:04:00Z'
                 )",
                [],
            )
            .is_err());
    }

    #[test]
    fn enforces_archive_consistency_and_version_uniqueness() {
        let mut repository = PatientRepository::in_memory().expect("in-memory repository");
        let patient = repository
            .create(input("Mara Example", "1984-06-12"))
            .expect("create patient");
        insert_persistence_graph(repository.connection(), &patient.id);

        assert!(repository
            .connection()
            .execute(
                "UPDATE patients SET is_archived = 1 WHERE id = ?1",
                [&patient.id],
            )
            .is_err());
        repository
            .connection()
            .execute(
                "UPDATE patients
                 SET is_archived = 1, archived_at = '2026-01-12T00:00:00Z'
                 WHERE id = ?1",
                [&patient.id],
            )
            .expect("archive patient consistently");
        let archived = repository.get(&patient.id).expect("archived patient");
        assert!(archived.is_archived);
        assert_eq!(
            archived.archived_at.as_deref(),
            Some("2026-01-12T00:00:00Z")
        );

        assert!(repository
            .connection()
            .execute(
                "INSERT INTO extraction_versions (
                    id, report_id, original_document_id, version_number,
                    extractor_id, extractor_version, extracted_at
                 ) VALUES (
                    'duplicate-extraction', 'report-1', 'document-1', 1,
                    'test-extractor', '2', '2026-01-11T11:00:00Z'
                 )",
                [],
            )
            .is_err());
        assert!(repository
            .connection()
            .execute(
                "INSERT INTO correction_history (
                    id, original_value_id, previous_working_value_id,
                    new_working_value_id, sequence_number, field_name,
                    old_value, new_value, changed_at
                 ) VALUES (
                    'duplicate-sequence', 'original-value-1',
                    'working-value-1', 'working-value-2', 1, 'unit',
                    'mg/l', 'g/l', '2026-01-11T11:00:00Z'
                 )",
                [],
            )
            .is_err());
    }

    #[test]
    fn supports_complete_crud_lifecycle_with_stable_id() {
        let mut repository = PatientRepository::in_memory().expect("in-memory repository");
        assert!(repository.list().expect("empty patient list").is_empty());

        let created = repository
            .create(input("Mara Example", "1984-06-12"))
            .expect("create patient");
        assert!(!created.id.is_empty());
        assert!(!created.is_archived);
        assert_eq!(created.archived_at, None);
        assert_eq!(
            repository.list().expect("patient list"),
            vec![created.clone()]
        );

        let updated = repository
            .update(&created.id, input("Mara Updated", "1984-06-12"))
            .expect("update patient");
        assert_eq!(updated.id, created.id);
        assert_eq!(updated.display_name, "Mara Updated");

        repository.delete(&created.id).expect("delete patient");
        assert!(repository.list().expect("empty patient list").is_empty());
        assert_eq!(
            repository.delete(&created.id),
            Err(PatientError::NotFound(created.id))
        );
    }

    #[test]
    fn persists_patients_after_repository_is_reopened() {
        let directory = tempdir().expect("temporary directory");
        let database_path = directory.path().join("patients.sqlite3");

        let created = {
            let mut repository = PatientRepository::open(&database_path).expect("open repository");
            repository
                .create(input("Mara Example", "1984-06-12"))
                .expect("create persistent patient")
        };

        let reopened = PatientRepository::open(&database_path).expect("reopen repository");
        assert_eq!(
            reopened.list().expect("persisted patient list"),
            vec![created]
        );
    }
}
