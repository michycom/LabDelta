use std::sync::{Mutex, MutexGuard};

use serde::Serialize;
use tauri::State;

use crate::domain::{
    ConfirmedReportValue, LaboratoryReportSummary, PatientDetails, PatientId, PatientSummary,
    ReferenceSource, ReportId,
};
use crate::persistence::PatientRepository;
use crate::read_model::{self, ReadError};

pub struct PatientStore(Mutex<PatientRepository>);

impl PatientStore {
    pub fn new(repository: PatientRepository) -> Self {
        Self(Mutex::new(repository))
    }

    fn repository(&self) -> Result<MutexGuard<'_, PatientRepository>, CommandError> {
        self.0.lock().map_err(|_| CommandError {
            code: CommandErrorCode::PersistenceUnavailable,
            message: "Local read persistence is unavailable".to_owned(),
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CommandErrorCode {
    InvalidInput,
    NotFound,
    InvalidStoredData,
    Persistence,
    PersistenceUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: CommandErrorCode,
    pub message: String,
}

impl From<ReadError> for CommandError {
    fn from(error: ReadError) -> Self {
        let code = match error {
            ReadError::InvalidIdentifier(_) => CommandErrorCode::InvalidInput,
            ReadError::NotFound { .. } => CommandErrorCode::NotFound,
            ReadError::InvalidStoredData { .. } => CommandErrorCode::InvalidStoredData,
            ReadError::Persistence(_) => CommandErrorCode::Persistence,
        };
        Self {
            code,
            message: error.to_string(),
        }
    }
}

#[tauri::command]
pub fn list_patients(store: State<'_, PatientStore>) -> Result<Vec<PatientSummary>, CommandError> {
    let repository = store.repository()?;
    read_model::list_patients(repository.connection()).map_err(Into::into)
}

#[tauri::command]
pub fn list_reference_sources(
    store: State<'_, PatientStore>,
) -> Result<Vec<ReferenceSource>, CommandError> {
    let repository = store.repository()?;
    read_model::list_reference_sources(repository.connection()).map_err(Into::into)
}

#[tauri::command]
pub fn get_patient_details(
    patient_id: String,
    store: State<'_, PatientStore>,
) -> Result<PatientDetails, CommandError> {
    let patient_id = PatientId::try_from(patient_id).map_err(ReadError::from)?;
    let repository = store.repository()?;
    read_model::patient_details(repository.connection(), &patient_id).map_err(Into::into)
}

#[tauri::command]
pub fn list_laboratory_reports(
    patient_id: String,
    store: State<'_, PatientStore>,
) -> Result<Vec<LaboratoryReportSummary>, CommandError> {
    let patient_id = PatientId::try_from(patient_id).map_err(ReadError::from)?;
    let repository = store.repository()?;
    read_model::laboratory_reports(repository.connection(), &patient_id).map_err(Into::into)
}

#[tauri::command]
pub fn list_confirmed_report_values(
    report_id: String,
    store: State<'_, PatientStore>,
) -> Result<Vec<ConfirmedReportValue>, CommandError> {
    let report_id = ReportId::try_from(report_id).map_err(ReadError::from)?;
    let repository = store.repository()?;
    read_model::confirmed_report_values(repository.connection(), &report_id).map_err(Into::into)
}

#[cfg(test)]
mod tests {
    use super::{CommandError, CommandErrorCode};
    use crate::read_model::ReadError;

    #[test]
    fn converts_read_failures_to_structured_command_errors() {
        let error = CommandError::from(ReadError::NotFound {
            entity: "patient",
            id: "missing".to_owned(),
        });

        assert_eq!(error.code, CommandErrorCode::NotFound);
        assert_eq!(error.message, "patient with ID 'missing' was not found");
    }
}
