use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Patient {
    pub id: String,
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientInput {
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ValidatedPatientInput {
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PatientError {
    #[error("{0}")]
    Validation(String),
    #[error("Patient with ID '{0}' was not found")]
    NotFound(String),
    #[error("Patient persistence failed: {0}")]
    Persistence(String),
}

impl PatientInput {
    pub(crate) fn validate(self) -> Result<ValidatedPatientInput, PatientError> {
        let display_name = self.display_name.trim().to_owned();
        if display_name.is_empty() {
            return Err(PatientError::Validation(
                "Patient name is required".to_owned(),
            ));
        }

        let date_of_birth = self.date_of_birth.trim();
        let parsed_date = NaiveDate::parse_from_str(date_of_birth, "%Y-%m-%d").map_err(|_| {
            PatientError::Validation(
                "Date of birth must be a valid date in YYYY-MM-DD format".to_owned(),
            )
        })?;
        if parsed_date > Utc::now().date_naive() {
            return Err(PatientError::Validation(
                "Date of birth cannot be in the future".to_owned(),
            ));
        }

        Ok(ValidatedPatientInput {
            display_name,
            date_of_birth: parsed_date.format("%Y-%m-%d").to_string(),
            sex_reference_context: normalize_optional(self.sex_reference_context),
            external_identifier: normalize_optional(self.external_identifier),
        })
    }
}

fn normalize_optional(value: Option<String>) -> Option<String> {
    value.and_then(|candidate| {
        let trimmed = candidate.trim();
        (!trimmed.is_empty()).then(|| trimmed.to_owned())
    })
}

#[cfg(test)]
mod tests {
    use super::{PatientError, PatientInput};

    fn input(name: &str, birth_date: &str) -> PatientInput {
        PatientInput {
            display_name: name.to_owned(),
            date_of_birth: birth_date.to_owned(),
            sex_reference_context: Some("  female  ".to_owned()),
            external_identifier: Some("  SYNTH-001  ".to_owned()),
        }
    }

    #[test]
    fn validates_and_normalizes_patient_input() {
        let validated = input("  Mara Example  ", "1984-06-12")
            .validate()
            .expect("valid patient input");

        assert_eq!(validated.display_name, "Mara Example");
        assert_eq!(validated.date_of_birth, "1984-06-12");
        assert_eq!(validated.sex_reference_context.as_deref(), Some("female"));
        assert_eq!(validated.external_identifier.as_deref(), Some("SYNTH-001"));
    }

    #[test]
    fn rejects_missing_name() {
        assert_eq!(
            input("   ", "1984-06-12").validate(),
            Err(PatientError::Validation(
                "Patient name is required".to_owned()
            ))
        );
    }

    #[test]
    fn rejects_invalid_or_future_birth_date() {
        assert!(matches!(
            input("Mara Example", "not-a-date").validate(),
            Err(PatientError::Validation(_))
        ));
        assert_eq!(
            input("Mara Example", "2999-01-01").validate(),
            Err(PatientError::Validation(
                "Date of birth cannot be in the future".to_owned()
            ))
        );
    }
}
