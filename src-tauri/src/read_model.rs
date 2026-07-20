use rusqlite::{Connection, OptionalExtension};
use thiserror::Error;

use crate::domain::{
    BodyMeasurement, ConfirmationStatus, ConfirmedReportValue, ExtractionVersionId,
    IdentifierError, LaboratoryReportSummary, OriginalDocumentId, OriginalDocumentReference,
    OriginalValueId, OriginalValueReference, PatientDetails, PatientId, PatientProfile,
    PatientSummary, PersistedValue, ProvenanceLocationId, ProvenanceLocator, ProvenanceReference,
    ReferenceCatalogParameter, ReferenceSource, ReferenceSourceAvailability, ReferenceSourceKind,
    ReportId, WorkingValueId,
};

pub(crate) fn list_reference_sources(
    connection: &Connection,
) -> Result<Vec<ReferenceSource>, ReadError> {
    let mut statement = connection
        .prepare(
            "SELECT id, version, source_kind, display_name, description,
                    availability, is_default, demonstration_only, source_notice
             FROM reference_sources
             ORDER BY is_default DESC, availability, display_name, version",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, u32>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, bool>(6)?,
                row.get::<_, bool>(7)?,
                row.get::<_, String>(8)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|row| {
            let kind = match row.2.as_str() {
                "report" => ReferenceSourceKind::Report,
                "demo_catalog" => ReferenceSourceKind::DemoCatalog,
                "ifcc" => ReferenceSourceKind::Ifcc,
                "dgkl" => ReferenceSourceKind::Dgkl,
                "local_laboratory" => ReferenceSourceKind::LocalLaboratory,
                value => return Err(invalid_reference_source(&row.0, "source kind", value)),
            };
            let availability = match row.5.as_str() {
                "active" => ReferenceSourceAvailability::Active,
                "future_disabled" => ReferenceSourceAvailability::FutureDisabled,
                value => return Err(invalid_reference_source(&row.0, "availability", value)),
            };
            Ok(ReferenceSource {
                id: row.0,
                version: row.1,
                kind,
                display_name: row.3,
                description: row.4,
                availability,
                is_default: row.6,
                demonstration_only: row.7,
                source_notice: row.8,
            })
        })
        .collect()
}

fn invalid_reference_source(id: &str, field: &str, value: &str) -> ReadError {
    ReadError::InvalidStoredData {
        entity: "reference source",
        id: id.to_owned(),
        reason: format!("unsupported {field} '{value}'"),
    }
}

pub(crate) fn reference_catalog_parameters(
    connection: &Connection,
    reference_source_id: &str,
    reference_source_version: u32,
) -> Result<Vec<ReferenceCatalogParameter>, ReadError> {
    let source_exists = connection
        .query_row(
            "SELECT 1 FROM reference_sources WHERE id = ?1 AND version = ?2",
            rusqlite::params![reference_source_id, reference_source_version],
            |_| Ok(()),
        )
        .optional()
        .map_err(persistence_error)?
        .is_some();
    if !source_exists {
        return Err(ReadError::NotFound {
            entity: "reference source",
            id: format!("{reference_source_id}@{reference_source_version}"),
        });
    }
    let mut statement = connection
        .prepare(
            "SELECT parameter.catalog_id, parameter.catalog_version,
                    parameter.parameter_id, parameter.display_name,
                    parameter.original_unit, parameter.lower_bound_text,
                    parameter.upper_bound_text, parameter.reference_rule_text,
                    parameter.context_notice, parameter.display_order
             FROM reference_catalog_parameters AS parameter
             JOIN reference_catalogs AS catalog
               ON catalog.id = parameter.catalog_id
              AND catalog.version = parameter.catalog_version
             WHERE catalog.reference_source_id = ?1
               AND catalog.reference_source_version = ?2
               AND catalog.status = 'active'
             ORDER BY parameter.display_order, parameter.parameter_id",
        )
        .map_err(persistence_error)?;
    let parameters = statement
        .query_map(
            rusqlite::params![reference_source_id, reference_source_version],
            |row| {
                Ok(ReferenceCatalogParameter {
                    catalog_id: row.get(0)?,
                    catalog_version: row.get(1)?,
                    parameter_id: row.get(2)?,
                    display_name: row.get(3)?,
                    original_unit: row.get(4)?,
                    lower_bound_text: row.get(5)?,
                    upper_bound_text: row.get(6)?,
                    reference_rule_text: row.get(7)?,
                    context_notice: row.get(8)?,
                    display_order: row.get(9)?,
                })
            },
        )
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    Ok(parameters)
}

#[derive(Debug, Error, PartialEq, Eq)]
pub(crate) enum ReadError {
    #[error("Invalid identifier: {0}")]
    InvalidIdentifier(String),
    #[error("{entity} with ID '{id}' was not found")]
    NotFound { entity: &'static str, id: String },
    #[error("Stored {entity} '{id}' is invalid: {reason}")]
    InvalidStoredData {
        entity: &'static str,
        id: String,
        reason: String,
    },
    #[error("Read persistence failed: {0}")]
    Persistence(String),
}

impl From<IdentifierError> for ReadError {
    fn from(error: IdentifierError) -> Self {
        Self::InvalidIdentifier(error.to_string())
    }
}

pub(crate) fn list_patients(connection: &Connection) -> Result<Vec<PatientSummary>, ReadError> {
    let mut statement = connection
        .prepare(
            "SELECT patient.id, patient.display_name, patient.date_of_birth,
                    patient.is_archived
             FROM patients AS patient
             WHERE EXISTS (
                SELECT 1
                FROM laboratory_reports AS report
                JOIN original_documents AS document
                  ON document.report_id = report.id
                JOIN demo_seed_documents AS seed_document
                  ON seed_document.original_document_id = document.id
                WHERE report.patient_id = patient.id
             )
             ORDER BY patient.display_name COLLATE NOCASE, patient.id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, bool>(3)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|(id, display_name, date_of_birth, is_archived)| {
            Ok(PatientSummary {
                id: PatientId::try_from(id)?,
                display_name,
                date_of_birth,
                is_archived,
            })
        })
        .collect()
}

pub(crate) fn patient_details(
    connection: &Connection,
    patient_id: &PatientId,
) -> Result<PatientDetails, ReadError> {
    let row = connection
        .query_row(
            "SELECT id, display_name, date_of_birth, sex_reference_context,
                    external_identifier, created_at, updated_at,
                    is_archived, archived_at
             FROM patients
             WHERE id = ?1
               AND EXISTS (
                    SELECT 1
                    FROM laboratory_reports AS report
                    JOIN original_documents AS document
                      ON document.report_id = report.id
                    JOIN demo_seed_documents AS seed_document
                      ON seed_document.original_document_id = document.id
                    WHERE report.patient_id = patients.id
               )",
            [patient_id.as_ref()],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, Option<String>>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, bool>(7)?,
                    row.get::<_, Option<String>>(8)?,
                ))
            },
        )
        .optional()
        .map_err(persistence_error)?
        .ok_or_else(|| ReadError::NotFound {
            entity: "patient",
            id: patient_id.as_ref().to_owned(),
        })?;
    let body_measurements = patient_body_measurements(connection, patient_id)?;
    let profiles = patient_profiles(connection, patient_id)?;
    Ok(PatientDetails {
        id: PatientId::try_from(row.0)?,
        display_name: row.1,
        date_of_birth: row.2,
        sex_reference_context: row.3,
        external_identifier: row.4,
        created_at: row.5,
        updated_at: row.6,
        is_archived: row.7,
        archived_at: row.8,
        body_measurements,
        profiles,
    })
}

fn patient_body_measurements(
    connection: &Connection,
    patient_id: &PatientId,
) -> Result<Vec<BodyMeasurement>, ReadError> {
    let mut statement = connection
        .prepare(
            "SELECT measurement_kind, measured_at, original_value_text,
                    original_unit, verification_status
             FROM patient_body_measurements
             WHERE patient_id = ?1
             ORDER BY measured_at, measurement_kind, id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([patient_id.as_ref()], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|row| {
            let verification_status = match row.4.as_str() {
                "explicit" => ConfirmationStatus::Explicit,
                value => {
                    return Err(ReadError::InvalidStoredData {
                        entity: "body measurement",
                        id: patient_id.as_ref().to_owned(),
                        reason: format!("unsupported verification status '{value}'"),
                    })
                }
            };
            Ok(BodyMeasurement {
                kind: row.0,
                measured_at: row.1,
                original_value_text: row.2,
                original_unit: row.3,
                verification_status,
            })
        })
        .collect()
}

fn patient_profiles(
    connection: &Connection,
    patient_id: &PatientId,
) -> Result<Vec<PatientProfile>, ReadError> {
    let mut statement = connection
        .prepare(
            "SELECT profile.id, profile.version, profile.name, profile.description
             FROM demo_patient_profiles AS assignment
             JOIN laboratory_profiles AS profile
               ON profile.id = assignment.profile_id
              AND profile.version = assignment.profile_version
             WHERE assignment.patient_id = ?1
             ORDER BY assignment.display_order, profile.id",
        )
        .map_err(persistence_error)?;
    let profiles = statement
        .query_map([patient_id.as_ref()], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, u32>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    profiles
        .into_iter()
        .map(|profile| {
            let mut members = connection
                .prepare(
                    "SELECT parameter.canonical_display
                     FROM profile_memberships AS membership
                     JOIN laboratory_parameters AS parameter
                       ON parameter.id = membership.parameter_id
                      AND parameter.version = membership.parameter_version
                     WHERE membership.profile_id = ?1
                       AND membership.profile_version = ?2
                     ORDER BY membership.display_order, parameter.id",
                )
                .map_err(persistence_error)?;
            let parameter_names = members
                .query_map(rusqlite::params![profile.0, profile.1], |row| row.get(0))
                .map_err(persistence_error)?
                .collect::<Result<Vec<_>, _>>()
                .map_err(persistence_error)?;
            Ok(PatientProfile {
                id: profile.0,
                version: profile.1,
                name: profile.2,
                description: profile.3,
                parameter_names,
            })
        })
        .collect()
}

pub(crate) fn laboratory_reports(
    connection: &Connection,
    patient_id: &PatientId,
) -> Result<Vec<LaboratoryReportSummary>, ReadError> {
    ensure_patient_exists(connection, patient_id)?;
    let mut statement = connection
        .prepare(
            "SELECT id, patient_id, laboratory_name, specimen_collected_at,
                    laboratory_received_at, report_released_at,
                    revision_number, imported_at
             FROM laboratory_reports
             WHERE patient_id = ?1
               AND EXISTS (
                    SELECT 1
                    FROM original_documents AS document
                    JOIN demo_seed_documents AS seed_document
                      ON seed_document.original_document_id = document.id
                    WHERE document.report_id = laboratory_reports.id
               )
             ORDER BY specimen_collected_at, laboratory_received_at,
                      report_released_at, revision_number, imported_at, id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([patient_id.as_ref()], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, String>(7)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|row| {
            Ok(LaboratoryReportSummary {
                id: ReportId::try_from(row.0)?,
                patient_id: PatientId::try_from(row.1)?,
                laboratory_name: row.2,
                specimen_collected_at: row.3,
                laboratory_received_at: row.4,
                report_released_at: row.5,
                revision_number: row.6,
                imported_at: row.7,
            })
        })
        .collect()
}

pub(crate) fn confirmed_report_values(
    connection: &Connection,
    report_id: &ReportId,
) -> Result<Vec<ConfirmedReportValue>, ReadError> {
    ensure_report_exists(connection, report_id)?;
    let mut statement = connection
        .prepare(
            "SELECT
                working.id, working.version_number, working.parameter_name,
                working.numeric_value_text, working.text_value, working.unit,
                working.reference_rule_text, working.confirmation_kind,
                extracted.extraction_version_id,
                original.id, original.source_parameter_name,
                original.original_value_text, original.original_unit,
                original.original_reference_text,
                location.id, location.locator_kind, location.page_number,
                location.row_number, location.column_name, location.json_path,
                location.text_start_offset, location.text_end_offset,
                location.text_excerpt,
                document.id, document.original_file_name,
                document.checksum_algorithm, document.content_checksum
             FROM confirmed_working_values AS working
             JOIN extracted_values AS extracted
               ON extracted.id = working.extracted_value_id
              AND extracted.original_value_id = working.original_value_id
             JOIN original_values AS original
               ON original.id = working.original_value_id
             JOIN provenance_locations AS location
               ON location.id = original.provenance_location_id
              AND location.original_document_id = original.original_document_id
              AND location.report_id = original.report_id
             JOIN original_documents AS document
               ON document.id = original.original_document_id
              AND document.report_id = original.report_id
             JOIN demo_seed_documents AS seed_document
               ON seed_document.original_document_id = document.id
             WHERE original.report_id = ?1
               AND working.confirmation_kind = 'explicit'
               AND working.version_number = (
                    SELECT MAX(latest.version_number)
                    FROM confirmed_working_values AS latest
                    WHERE latest.original_value_id = working.original_value_id
               )
             ORDER BY original.source_parameter_name COLLATE NOCASE,
                      original.id, working.id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([report_id.as_ref()], |row| {
            Ok(RawConfirmedValue {
                working_id: row.get(0)?,
                version_number: row.get(1)?,
                parameter_name: row.get(2)?,
                numeric_value_text: row.get(3)?,
                text_value: row.get(4)?,
                unit: row.get(5)?,
                supplied_reference_range: row.get(6)?,
                confirmation_kind: row.get(7)?,
                extraction_version_id: row.get(8)?,
                original_id: row.get(9)?,
                original_parameter_name: row.get(10)?,
                original_value_text: row.get(11)?,
                original_unit: row.get(12)?,
                original_reference_range: row.get(13)?,
                location_id: row.get(14)?,
                locator_kind: row.get(15)?,
                page_number: row.get(16)?,
                row_number: row.get(17)?,
                column_name: row.get(18)?,
                json_path: row.get(19)?,
                text_start_offset: row.get(20)?,
                text_end_offset: row.get(21)?,
                text_excerpt: row.get(22)?,
                document_id: row.get(23)?,
                original_file_name: row.get(24)?,
                checksum_algorithm: row.get(25)?,
                content_checksum: row.get(26)?,
            })
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|raw| confirmed_value_from_raw(report_id, raw))
        .collect()
}

struct RawConfirmedValue {
    working_id: String,
    version_number: i64,
    parameter_name: String,
    numeric_value_text: Option<String>,
    text_value: Option<String>,
    unit: Option<String>,
    supplied_reference_range: Option<String>,
    confirmation_kind: String,
    extraction_version_id: String,
    original_id: String,
    original_parameter_name: String,
    original_value_text: String,
    original_unit: Option<String>,
    original_reference_range: Option<String>,
    location_id: String,
    locator_kind: String,
    page_number: Option<i64>,
    row_number: Option<i64>,
    column_name: Option<String>,
    json_path: Option<String>,
    text_start_offset: Option<i64>,
    text_end_offset: Option<i64>,
    text_excerpt: Option<String>,
    document_id: String,
    original_file_name: String,
    checksum_algorithm: String,
    content_checksum: String,
}

fn confirmed_value_from_raw(
    report_id: &ReportId,
    raw: RawConfirmedValue,
) -> Result<ConfirmedReportValue, ReadError> {
    let locator = provenance_locator(&raw)?;
    let persisted_value = match (raw.numeric_value_text, raw.text_value) {
        (Some(value), None) => PersistedValue::NumericText(value),
        (None, Some(value)) => PersistedValue::Text(value),
        _ => {
            return Err(invalid_stored(
                "working value",
                &raw.working_id,
                "exactly one persisted value representation is required",
            ))
        }
    };
    if raw.confirmation_kind != "explicit" {
        return Err(invalid_stored(
            "working value",
            &raw.working_id,
            "only explicit confirmation is supported",
        ));
    }
    let version_number = u32::try_from(raw.version_number).map_err(|_| {
        invalid_stored(
            "working value",
            &raw.working_id,
            "version number is outside the supported range",
        )
    })?;
    Ok(ConfirmedReportValue {
        id: WorkingValueId::try_from(raw.working_id)?,
        report_id: report_id.clone(),
        extraction_version_id: ExtractionVersionId::try_from(raw.extraction_version_id)?,
        version_number,
        parameter_name: raw.parameter_name,
        confirmed_value: persisted_value,
        unit: raw.unit,
        supplied_reference_range: raw.supplied_reference_range,
        confirmation_status: ConfirmationStatus::Explicit,
        original: OriginalValueReference {
            id: OriginalValueId::try_from(raw.original_id)?,
            parameter_name: raw.original_parameter_name,
            value_text: raw.original_value_text,
            unit: raw.original_unit,
            supplied_reference_range: raw.original_reference_range,
            document: OriginalDocumentReference {
                id: OriginalDocumentId::try_from(raw.document_id)?,
                original_file_name: raw.original_file_name,
                checksum_algorithm: raw.checksum_algorithm,
                content_checksum: raw.content_checksum,
            },
        },
        provenance: ProvenanceReference {
            id: ProvenanceLocationId::try_from(raw.location_id)?,
            locator,
            text_excerpt: raw.text_excerpt,
        },
    })
}

fn provenance_locator(raw: &RawConfirmedValue) -> Result<ProvenanceLocator, ReadError> {
    match raw.locator_kind.as_str() {
        "json_path" => raw
            .json_path
            .clone()
            .map(|path| ProvenanceLocator::JsonPath { path })
            .ok_or_else(|| {
                invalid_stored(
                    "provenance location",
                    &raw.location_id,
                    "JSON path is missing",
                )
            }),
        "page" => positive_u32(raw.page_number, "page number", &raw.location_id)
            .map(|page_number| ProvenanceLocator::Page { page_number }),
        "table_cell" => {
            let row_number = positive_u32(raw.row_number, "row number", &raw.location_id)?;
            let column_name = raw.column_name.clone().ok_or_else(|| {
                invalid_stored(
                    "provenance location",
                    &raw.location_id,
                    "column name is missing",
                )
            })?;
            Ok(ProvenanceLocator::TableCell {
                row_number,
                column_name,
            })
        }
        "text_span" => {
            let start_offset =
                nonnegative_u32(raw.text_start_offset, "text start offset", &raw.location_id)?;
            let end_offset =
                nonnegative_u32(raw.text_end_offset, "text end offset", &raw.location_id)?;
            Ok(ProvenanceLocator::TextSpan {
                start_offset,
                end_offset,
            })
        }
        "document" => Ok(ProvenanceLocator::Document),
        other => Err(invalid_stored(
            "provenance location",
            &raw.location_id,
            &format!("unsupported locator kind '{other}'"),
        )),
    }
}

fn positive_u32(value: Option<i64>, name: &str, id: &str) -> Result<u32, ReadError> {
    let value = value
        .ok_or_else(|| invalid_stored("provenance location", id, &format!("{name} is missing")))?;
    let converted = u32::try_from(value).map_err(|_| {
        invalid_stored(
            "provenance location",
            id,
            &format!("{name} is outside the supported range"),
        )
    })?;
    if converted == 0 {
        return Err(invalid_stored(
            "provenance location",
            id,
            &format!("{name} must be positive"),
        ));
    }
    Ok(converted)
}

fn nonnegative_u32(value: Option<i64>, name: &str, id: &str) -> Result<u32, ReadError> {
    let value = value
        .ok_or_else(|| invalid_stored("provenance location", id, &format!("{name} is missing")))?;
    u32::try_from(value).map_err(|_| {
        invalid_stored(
            "provenance location",
            id,
            &format!("{name} is outside the supported range"),
        )
    })
}

fn ensure_patient_exists(connection: &Connection, patient_id: &PatientId) -> Result<(), ReadError> {
    let exists = connection
        .query_row(
            "SELECT EXISTS(
                SELECT 1
                FROM patients AS patient
                JOIN laboratory_reports AS report
                  ON report.patient_id = patient.id
                JOIN original_documents AS document
                  ON document.report_id = report.id
                JOIN demo_seed_documents AS seed_document
                  ON seed_document.original_document_id = document.id
                WHERE patient.id = ?1
             )",
            [patient_id.as_ref()],
            |row| row.get::<_, bool>(0),
        )
        .map_err(persistence_error)?;
    if !exists {
        return Err(ReadError::NotFound {
            entity: "patient",
            id: patient_id.as_ref().to_owned(),
        });
    }
    Ok(())
}

fn ensure_report_exists(connection: &Connection, report_id: &ReportId) -> Result<(), ReadError> {
    let exists = connection
        .query_row(
            "SELECT EXISTS(
                SELECT 1
                FROM laboratory_reports AS report
                JOIN original_documents AS document
                  ON document.report_id = report.id
                JOIN demo_seed_documents AS seed_document
                  ON seed_document.original_document_id = document.id
                WHERE report.id = ?1
             )",
            [report_id.as_ref()],
            |row| row.get::<_, bool>(0),
        )
        .map_err(persistence_error)?;
    if !exists {
        return Err(ReadError::NotFound {
            entity: "laboratory report",
            id: report_id.as_ref().to_owned(),
        });
    }
    Ok(())
}

fn invalid_stored(entity: &'static str, id: &str, reason: &str) -> ReadError {
    ReadError::InvalidStoredData {
        entity,
        id: id.to_owned(),
        reason: reason.to_owned(),
    }
}

fn persistence_error(error: rusqlite::Error) -> ReadError {
    ReadError::Persistence(error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{confirmed_report_values, laboratory_reports, list_patients, patient_details};
    use crate::demo_seed;
    use crate::domain::{
        ConfirmationStatus, PatientInput, PersistedValue, ProvenanceLocator, ReportId,
    };
    use crate::persistence::PatientRepository;

    fn seeded_repository() -> PatientRepository {
        let mut repository = PatientRepository::in_memory().expect("database");
        demo_seed::apply(&mut repository).expect("seed");
        repository
    }

    #[test]
    fn reads_seeded_patients_and_patient_details_deterministically() {
        let repository = seeded_repository();
        let patients = list_patients(repository.connection()).expect("patients");

        assert_eq!(
            patients
                .iter()
                .map(|patient| patient.display_name.as_str())
                .collect::<Vec<_>>(),
            ["Daniel Power", "Dirk Mayer", "Eva Mittel"]
        );
        let eva = patients
            .iter()
            .find(|patient| patient.display_name == "Eva Mittel")
            .expect("Eva patient");
        let details = patient_details(repository.connection(), &eva.id).expect("details");
        assert_eq!(details.external_identifier.as_deref(), Some("DEMO-EVA"));
        assert_eq!(details.sex_reference_context.as_deref(), Some("female"));
        assert!(!details.is_archived);
    }

    #[test]
    fn reads_reports_in_foundation_chronology_order() {
        let repository = seeded_repository();
        let patients = list_patients(repository.connection()).expect("patients");
        let dirk = patients
            .iter()
            .find(|patient| patient.display_name == "Dirk Mayer")
            .expect("Dirk patient");

        let reports = laboratory_reports(repository.connection(), &dirk.id).expect("reports");

        assert_eq!(reports.len(), 3);
        assert_eq!(
            reports
                .iter()
                .map(|report| report.specimen_collected_at.as_deref())
                .collect::<Vec<_>>(),
            [
                Some("2025-08-05T08:00:00Z"),
                Some("2026-01-10T08:00:00Z"),
                Some("2026-06-20T08:00:00Z")
            ]
        );
    }

    #[test]
    fn reads_only_latest_explicit_values_with_originals_and_provenance() {
        let repository = seeded_repository();
        let patients = list_patients(repository.connection()).expect("patients");
        let eva = patients
            .iter()
            .find(|patient| patient.display_name == "Eva Mittel")
            .expect("Eva patient");
        let report = laboratory_reports(repository.connection(), &eva.id)
            .expect("reports")
            .into_iter()
            .next()
            .expect("first report");

        let values =
            confirmed_report_values(repository.connection(), &report.id).expect("confirmed values");

        assert_eq!(values.len(), 10);
        assert_eq!(values[0].confirmation_status, ConfirmationStatus::Explicit);
        assert_eq!(
            values[0].confirmed_value,
            PersistedValue::NumericText("4.55".to_owned())
        );
        assert_eq!(values[0].original.parameter_name, "Erythrocytes");
        assert_eq!(values[0].original.value_text, "4.55");
        assert_eq!(values[0].original.unit.as_deref(), Some("T/L"));
        assert_eq!(
            values[0].original.supplied_reference_range.as_deref(),
            Some("3.9-5.2")
        );
        assert!(matches!(
            values[0].provenance.locator,
            ProvenanceLocator::JsonPath { .. }
        ));
        assert_eq!(
            values[0].original.document.original_file_name,
            "eva-mittel.json"
        );
        let command_payload = serde_json::to_value(&values[0]).expect("command JSON payload");
        assert_eq!(command_payload["confirmationStatus"], "explicit");
        assert_eq!(command_payload["confirmedValue"]["kind"], "numericText");
        assert_eq!(command_payload["provenance"]["locator"]["kind"], "jsonPath");
        assert_eq!(
            command_payload["provenance"]["locator"]["path"],
            "$.reports[0].values[1]"
        );
    }

    #[test]
    fn reports_structured_not_found_errors() {
        let repository = seeded_repository();
        let missing_report = ReportId::try_from("missing-report".to_owned()).expect("ID");

        let error = confirmed_report_values(repository.connection(), &missing_report)
            .expect_err("missing report error");

        assert!(matches!(error, super::ReadError::NotFound { .. }));
    }

    #[test]
    fn hides_records_without_approved_seed_provenance() {
        let mut repository = PatientRepository::in_memory().expect("database");
        let legacy_patient = repository
            .create(PatientInput {
                display_name: "Unapproved local record".to_owned(),
                date_of_birth: "1990-01-01".to_owned(),
                sex_reference_context: None,
                external_identifier: Some("LOCAL-UNAPPROVED".to_owned()),
            })
            .expect("unapproved local patient");
        demo_seed::apply(&mut repository).expect("seed");

        let patients = list_patients(repository.connection()).expect("approved patients");

        assert_eq!(patients.len(), 3);
        assert!(patients
            .iter()
            .all(|patient| patient.display_name != "Unapproved local record"));
        let legacy_id = crate::domain::PatientId::try_from(legacy_patient.id).expect("legacy ID");
        assert!(matches!(
            patient_details(repository.connection(), &legacy_id),
            Err(super::ReadError::NotFound { .. })
        ));
    }
}
