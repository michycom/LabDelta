use std::path::Path;
use std::time::Duration;

use chrono::{SecondsFormat, Utc};
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::domain::{Patient, PatientError, PatientInput};

pub struct PatientRepository {
    connection: Connection,
}

impl PatientRepository {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PatientError> {
        let connection = Connection::open(path).map_err(persistence_error)?;
        Self::from_connection(connection)
    }

    #[cfg(test)]
    fn in_memory() -> Result<Self, PatientError> {
        let connection = Connection::open_in_memory().map_err(persistence_error)?;
        Self::from_connection(connection)
    }

    fn from_connection(connection: Connection) -> Result<Self, PatientError> {
        connection
            .busy_timeout(Duration::from_secs(5))
            .map_err(persistence_error)?;
        connection
            .execute_batch(
                "PRAGMA foreign_keys = ON;
                 CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY NOT NULL,
                    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
                    date_of_birth TEXT NOT NULL,
                    sex_reference_context TEXT,
                    external_identifier TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                 );
                 INSERT OR IGNORE INTO schema_migrations(version, applied_at)
                 VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));",
            )
            .map_err(persistence_error)?;
        Ok(Self { connection })
    }

    pub fn list(&self) -> Result<Vec<Patient>, PatientError> {
        let mut statement = self
            .connection
            .prepare(
                "SELECT id, display_name, date_of_birth, sex_reference_context,
                        external_identifier, created_at, updated_at
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

    fn get(&self, id: &str) -> Result<Patient, PatientError> {
        self.connection
            .query_row(
                "SELECT id, display_name, date_of_birth, sex_reference_context,
                        external_identifier, created_at, updated_at
                 FROM patients WHERE id = ?1",
                [id],
                patient_from_row,
            )
            .map_err(|error| match error {
                rusqlite::Error::QueryReturnedNoRows => PatientError::NotFound(id.to_owned()),
                other => persistence_error(other),
            })
    }
}

fn patient_from_row(row: &Row<'_>) -> rusqlite::Result<Patient> {
    Ok(Patient {
        id: row.get(0)?,
        display_name: row.get(1)?,
        date_of_birth: row.get(2)?,
        sex_reference_context: row.get(3)?,
        external_identifier: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn persistence_error(error: rusqlite::Error) -> PatientError {
    PatientError::Persistence(error.to_string())
}

#[cfg(test)]
mod tests {
    use tempfile::tempdir;

    use super::PatientRepository;
    use crate::domain::{PatientError, PatientInput};

    fn input(name: &str, birth_date: &str) -> PatientInput {
        PatientInput {
            display_name: name.to_owned(),
            date_of_birth: birth_date.to_owned(),
            sex_reference_context: Some("female".to_owned()),
            external_identifier: None,
        }
    }

    #[test]
    fn supports_complete_crud_lifecycle_with_stable_id() {
        let mut repository = PatientRepository::in_memory().expect("in-memory repository");
        assert!(repository.list().expect("empty patient list").is_empty());

        let created = repository
            .create(input("Mara Example", "1984-06-12"))
            .expect("create patient");
        assert!(!created.id.is_empty());
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
