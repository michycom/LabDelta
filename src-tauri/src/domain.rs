#[cfg(test)]
use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
#[error("{kind} must not be empty")]
pub struct IdentifierError {
    kind: &'static str,
}

macro_rules! stable_id_type {
    ($name:ident, $kind:literal) => {
        #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
        #[serde(transparent)]
        pub struct $name(String);

        impl AsRef<str> for $name {
            fn as_ref(&self) -> &str {
                &self.0
            }
        }

        impl TryFrom<String> for $name {
            type Error = IdentifierError;

            fn try_from(value: String) -> Result<Self, Self::Error> {
                if value.trim().is_empty() {
                    Err(IdentifierError { kind: $kind })
                } else {
                    Ok(Self(value))
                }
            }
        }
    };
}

stable_id_type!(PatientId, "patient ID");
stable_id_type!(ReportId, "report ID");
stable_id_type!(OriginalDocumentId, "original document ID");
stable_id_type!(OriginalValueId, "original value ID");
stable_id_type!(ExtractionVersionId, "extraction version ID");
stable_id_type!(WorkingValueId, "working value ID");
stable_id_type!(ProvenanceLocationId, "provenance location ID");

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientSummary {
    pub id: PatientId,
    pub display_name: String,
    pub date_of_birth: String,
    pub is_archived: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientDetails {
    pub id: PatientId,
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_archived: bool,
    pub archived_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LaboratoryReportSummary {
    pub id: ReportId,
    pub patient_id: PatientId,
    pub laboratory_name: Option<String>,
    pub specimen_collected_at: Option<String>,
    pub laboratory_received_at: Option<String>,
    pub report_released_at: Option<String>,
    pub revision_number: Option<String>,
    pub imported_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReferenceSourceKind {
    Report,
    DemoCatalog,
    Ifcc,
    Dgkl,
    LocalLaboratory,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReferenceSourceAvailability {
    Active,
    FutureDisabled,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferenceSource {
    pub id: String,
    pub version: u32,
    pub kind: ReferenceSourceKind,
    pub display_name: String,
    pub description: String,
    pub availability: ReferenceSourceAvailability,
    pub is_default: bool,
    pub demonstration_only: bool,
    pub source_notice: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value", rename_all = "camelCase")]
pub enum PersistedValue {
    NumericText(String),
    Text(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConfirmationStatus {
    Explicit,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OriginalDocumentReference {
    pub id: OriginalDocumentId,
    pub original_file_name: String,
    pub checksum_algorithm: String,
    pub content_checksum: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OriginalValueReference {
    pub id: OriginalValueId,
    pub parameter_name: String,
    pub value_text: String,
    pub unit: Option<String>,
    pub supplied_reference_range: Option<String>,
    pub document: OriginalDocumentReference,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ProvenanceLocator {
    JsonPath {
        path: String,
    },
    Page {
        page_number: u32,
    },
    TableCell {
        row_number: u32,
        column_name: String,
    },
    TextSpan {
        start_offset: u32,
        end_offset: u32,
    },
    Document,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProvenanceReference {
    pub id: ProvenanceLocationId,
    pub locator: ProvenanceLocator,
    pub text_excerpt: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfirmedReportValue {
    pub id: WorkingValueId,
    pub report_id: ReportId,
    pub extraction_version_id: ExtractionVersionId,
    pub version_number: u32,
    pub parameter_name: String,
    pub confirmed_value: PersistedValue,
    pub unit: Option<String>,
    pub supplied_reference_range: Option<String>,
    pub confirmation_status: ConfirmationStatus,
    pub original: OriginalValueReference,
    pub provenance: ProvenanceReference,
}

#[cfg(test)]
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
    pub is_archived: bool,
    pub archived_at: Option<String>,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientInput {
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ValidatedPatientInput {
    pub display_name: String,
    pub date_of_birth: String,
    pub sex_reference_context: Option<String>,
    pub external_identifier: Option<String>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PatientError {
    #[cfg(test)]
    #[error("{0}")]
    Validation(String),
    #[cfg(test)]
    #[error("Patient with ID '{0}' was not found")]
    NotFound(String),
    #[error("Patient persistence failed: {0}")]
    Persistence(String),
}

#[cfg(test)]
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

#[cfg(test)]
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
