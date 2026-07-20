use rusqlite::{params, OptionalExtension, Params, Transaction};
use sha2::{Digest, Sha256};
use thiserror::Error;
use uuid::Uuid;

use crate::demo_fixtures::{approved_fixtures, ApprovedFixtureSet, FixtureError};
use crate::persistence::PatientRepository;

const SEED_EXTRACTOR_ID: &str = "labdelta-approved-demo-seed";
const SEED_EXTRACTOR_VERSION: &str = "1";

#[derive(Debug, Error, PartialEq, Eq)]
pub(crate) enum DemoSeedError {
    #[error(transparent)]
    Fixture(#[from] FixtureError),
    #[error("Demo seed '{seed_version}' conflicts with existing data: {reason}")]
    Conflict {
        seed_version: String,
        reason: String,
    },
    #[error("Demo seed persistence failed: {0}")]
    Persistence(String),
}

pub(crate) fn apply(repository: &mut PatientRepository) -> Result<(), DemoSeedError> {
    let approved = approved_fixtures()?;
    apply_approved(repository, &approved)
}

fn apply_approved(
    repository: &mut PatientRepository,
    approved: &ApprovedFixtureSet,
) -> Result<(), DemoSeedError> {
    let seed_version = approved.manifest.seed_version.as_str();
    let transaction = repository
        .connection_mut()
        .transaction()
        .map_err(persistence_error)?;
    let existing_run = transaction
        .query_row(
            "SELECT manifest_version, manifest_sha256, demo_marker
             FROM demo_seed_runs
             WHERE seed_version = ?1",
            [seed_version],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            },
        )
        .optional()
        .map_err(persistence_error)?;

    if let Some((manifest_version, manifest_sha256, demo_marker)) = existing_run {
        if manifest_version != approved.manifest.manifest_version
            || manifest_sha256 != approved.manifest_sha256
            || demo_marker != approved.manifest.demo_marker
        {
            return Err(conflict(
                seed_version,
                "the recorded manifest identity differs from the embedded manifest",
            ));
        }
        verify_existing_seed(&transaction, approved)?;
        transaction.commit().map_err(persistence_error)?;
        return Ok(());
    }

    insert_seed(&transaction, approved)?;
    ensure_no_foreign_key_violations(&transaction)?;
    transaction.commit().map_err(persistence_error)?;
    Ok(())
}

fn insert_seed(
    transaction: &Transaction<'_>,
    approved: &ApprovedFixtureSet,
) -> Result<(), DemoSeedError> {
    let seed_version = approved.manifest.seed_version.as_str();
    transaction
        .execute(
            "INSERT INTO demo_seed_runs (
                seed_version, manifest_version, manifest_sha256,
                demo_marker, applied_at
             ) VALUES (?1, ?2, ?3, ?4, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
            params![
                seed_version,
                approved.manifest.manifest_version,
                approved.manifest_sha256,
                approved.manifest.demo_marker,
            ],
        )
        .map_err(persistence_error)?;

    for approved_fixture in &approved.fixtures {
        let entry = &approved_fixture.entry;
        let fixture = &approved_fixture.fixture;
        transaction
            .execute(
                "INSERT INTO demo_seed_fixtures (
                    seed_version, fixture_id, fixture_version, demo_marker,
                    content_sha256, source_path
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    seed_version,
                    entry.fixture_id,
                    entry.fixture_version,
                    entry.demo_marker,
                    entry.sha256,
                    entry.path,
                ],
            )
            .map_err(persistence_error)?;

        let patient_id = stable_id(&[
            seed_version,
            entry.fixture_id.as_str(),
            "patient",
            fixture.patient.source_key.as_str(),
        ]);
        let patient_timestamp = fixture
            .reports
            .first()
            .expect("validated fixture has reports")
            .imported_at
            .as_str();
        transaction
            .execute(
                "INSERT INTO patients (
                    id, display_name, date_of_birth, sex_reference_context,
                    external_identifier, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
                params![
                    patient_id,
                    fixture.patient.display_name,
                    fixture.patient.date_of_birth,
                    fixture.patient.sex_reference_context,
                    fixture.patient.external_identifier,
                    patient_timestamp,
                ],
            )
            .map_err(persistence_error)?;

        for (display_order, profile_id) in fixture.profile_ids.iter().enumerate() {
            transaction
                .execute(
                    "INSERT INTO demo_patient_profiles (
                        patient_id, profile_id, profile_version, seed_version,
                        fixture_id, display_order
                     ) VALUES (?1, ?2, 1, ?3, ?4, ?5)",
                    params![
                        patient_id,
                        profile_id,
                        seed_version,
                        entry.fixture_id,
                        i64::try_from(display_order).map_err(|_| conflict(
                            seed_version,
                            "profile display order exceeds SQLite integer range",
                        ))?,
                    ],
                )
                .map_err(persistence_error)?;
        }

        for report in &fixture.reports {
            let report_id = stable_id(&[
                seed_version,
                entry.fixture_id.as_str(),
                "report",
                report.source_key.as_str(),
            ]);
            let document_id = stable_id(&[
                seed_version,
                entry.fixture_id.as_str(),
                "document",
                report.source_key.as_str(),
            ]);
            let extraction_id = stable_id(&[
                seed_version,
                entry.fixture_id.as_str(),
                "extraction",
                report.source_key.as_str(),
            ]);
            transaction
                .execute(
                    "INSERT INTO laboratory_reports (
                        id, patient_id, laboratory_name, specimen_collected_at,
                        laboratory_received_at, report_released_at,
                        revision_number, imported_at, fixture_id,
                        fixture_version, demo_marker, verified_checksum,
                        extracted_identity_json, identity_match_status,
                        identity_manually_confirmed
                     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
                               'confirmed', 1)",
                    params![
                        report_id,
                        patient_id,
                        report.laboratory_name,
                        report.specimen_collected_at,
                        report.laboratory_received_at,
                        report.report_released_at,
                        report.revision_number,
                        report.imported_at,
                        entry.fixture_id,
                        entry.fixture_version,
                        entry.demo_marker,
                        entry.sha256,
                        serde_json::to_string(&fixture.patient.external_identifier)
                            .map_err(|error| conflict(seed_version, &error.to_string()))?,
                    ],
                )
                .map_err(persistence_error)?;
            transaction
                .execute(
                    "INSERT INTO original_documents (
                        id, report_id, source_type, original_file_name,
                        media_type, checksum_algorithm, content_checksum,
                        storage_path, byte_size, recorded_at
                     ) VALUES (?1, ?2, 'approved-demo-fixture', ?3,
                               'application/json', 'SHA-256', ?4, ?5, ?6, ?7)",
                    params![
                        document_id,
                        report_id,
                        entry.path,
                        entry.sha256,
                        format!("embedded://fixtures/demo_seed/v1/{}", entry.path),
                        i64::try_from(approved_fixture.content.len()).map_err(|_| {
                            conflict(
                                seed_version,
                                "fixture byte size exceeds SQLite integer range",
                            )
                        })?,
                        report.imported_at,
                    ],
                )
                .map_err(persistence_error)?;
            transaction
                .execute(
                    "INSERT INTO demo_seed_documents (
                        seed_version, fixture_id, original_document_id
                     ) VALUES (?1, ?2, ?3)",
                    params![seed_version, entry.fixture_id, document_id],
                )
                .map_err(persistence_error)?;
            transaction
                .execute(
                    "INSERT INTO extraction_versions (
                        id, report_id, original_document_id, version_number,
                        extractor_id, extractor_version, extracted_at
                     ) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6)",
                    params![
                        extraction_id,
                        report_id,
                        document_id,
                        SEED_EXTRACTOR_ID,
                        SEED_EXTRACTOR_VERSION,
                        report.imported_at,
                    ],
                )
                .map_err(persistence_error)?;

            for value in &report.values {
                let location_id = stable_id(&[
                    seed_version,
                    entry.fixture_id.as_str(),
                    "location",
                    report.source_key.as_str(),
                    value.source_key.as_str(),
                ]);
                let original_value_id = stable_id(&[
                    seed_version,
                    entry.fixture_id.as_str(),
                    "original-value",
                    report.source_key.as_str(),
                    value.source_key.as_str(),
                ]);
                let extracted_value_id = stable_id(&[
                    seed_version,
                    entry.fixture_id.as_str(),
                    "extracted-value",
                    report.source_key.as_str(),
                    value.source_key.as_str(),
                ]);
                let working_value_id = stable_id(&[
                    seed_version,
                    entry.fixture_id.as_str(),
                    "working-value",
                    report.source_key.as_str(),
                    value.source_key.as_str(),
                ]);
                transaction
                    .execute(
                        "INSERT INTO provenance_locations (
                            id, report_id, original_document_id, locator_kind,
                            json_path, text_excerpt, recorded_at
                         ) VALUES (?1, ?2, ?3, 'json_path', ?4, ?5, ?6)",
                        params![
                            location_id,
                            report_id,
                            document_id,
                            value.source_location.json_path,
                            value.source_location.text_excerpt,
                            report.imported_at,
                        ],
                    )
                    .map_err(persistence_error)?;
                transaction
                    .execute(
                        "INSERT INTO original_values (
                            id, report_id, original_document_id,
                            provenance_location_id, source_parameter_name,
                            original_value_text, original_unit,
                            original_reference_text, recorded_at
                         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                        params![
                            original_value_id,
                            report_id,
                            document_id,
                            location_id,
                            value.original_parameter_name,
                            value.original_value,
                            value.unit,
                            value.reference_range,
                            report.imported_at,
                        ],
                    )
                    .map_err(persistence_error)?;
                transaction
                    .execute(
                        "INSERT INTO extracted_values (
                            id, report_id, original_document_id,
                            extraction_version_id, original_value_id,
                            extracted_parameter_name, numeric_value_text,
                            extracted_unit, reference_rule_text, recorded_at
                         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                        params![
                            extracted_value_id,
                            report_id,
                            document_id,
                            extraction_id,
                            original_value_id,
                            value.original_parameter_name,
                            value.original_value,
                            value.unit,
                            value.reference_range,
                            report.imported_at,
                        ],
                    )
                    .map_err(persistence_error)?;
                transaction
                    .execute(
                        "INSERT INTO confirmed_working_values (
                            id, original_value_id, extracted_value_id,
                            version_number, parameter_name, numeric_value_text,
                            unit, reference_rule_text, confirmation_kind,
                            confirmed_at, recorded_at
                         ) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7,
                                   'explicit', ?8, ?8)",
                        params![
                            working_value_id,
                            original_value_id,
                            extracted_value_id,
                            value.original_parameter_name,
                            value.original_value,
                            value.unit,
                            value.reference_range,
                            report.imported_at,
                        ],
                    )
                    .map_err(persistence_error)?;

                if let Some(measurement) = fixture
                    .body_measurements
                    .iter()
                    .find(|measurement| measurement.source_key == value.source_key)
                {
                    let measurement_id = stable_id(&[
                        seed_version,
                        entry.fixture_id.as_str(),
                        "body-measurement",
                        measurement.source_key.as_str(),
                    ]);
                    transaction
                        .execute(
                            "INSERT INTO patient_body_measurements (
                                id, patient_id, measurement_kind, measured_at,
                                original_value_text, original_unit,
                                verification_status, original_value_id,
                                provenance_location_id, recorded_at
                             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'explicit', ?7, ?8, ?9)",
                            params![
                                measurement_id,
                                patient_id,
                                measurement.kind,
                                measurement.measured_at,
                                measurement.original_value,
                                measurement.original_unit,
                                original_value_id,
                                location_id,
                                report.imported_at,
                            ],
                        )
                        .map_err(persistence_error)?;
                }
            }
        }
    }
    Ok(())
}

fn verify_existing_seed(
    transaction: &Transaction<'_>,
    approved: &ApprovedFixtureSet,
) -> Result<(), DemoSeedError> {
    let seed_version = approved.manifest.seed_version.as_str();
    ensure_count(
        transaction,
        "SELECT COUNT(*) FROM demo_seed_fixtures WHERE seed_version = ?1",
        [seed_version],
        approved.fixtures.len(),
        seed_version,
        "recorded fixture count",
    )?;

    let expected_document_count = approved
        .fixtures
        .iter()
        .map(|approved_fixture| approved_fixture.fixture.reports.len())
        .sum::<usize>();
    ensure_count(
        transaction,
        "SELECT COUNT(*) FROM demo_seed_documents WHERE seed_version = ?1",
        [seed_version],
        expected_document_count,
        seed_version,
        "recorded document count",
    )?;

    for approved_fixture in &approved.fixtures {
        let entry = &approved_fixture.entry;
        let fixture = &approved_fixture.fixture;
        ensure_exists(
            transaction,
            "SELECT EXISTS(
                SELECT 1 FROM demo_seed_fixtures
                WHERE seed_version = ?1 AND fixture_id = ?2
                  AND fixture_version = ?3 AND demo_marker = ?4
                  AND content_sha256 = ?5 AND source_path = ?6
             )",
            params![
                seed_version,
                entry.fixture_id,
                entry.fixture_version,
                entry.demo_marker,
                entry.sha256,
                entry.path,
            ],
            seed_version,
            &format!("fixture '{}'", entry.fixture_id),
        )?;

        let patient_id = stable_id(&[
            seed_version,
            entry.fixture_id.as_str(),
            "patient",
            fixture.patient.source_key.as_str(),
        ]);
        let patient_timestamp = fixture
            .reports
            .first()
            .expect("validated fixture has reports")
            .imported_at
            .as_str();
        ensure_exists(
            transaction,
            "SELECT EXISTS(
                SELECT 1 FROM patients
                WHERE id = ?1 AND display_name = ?2 AND date_of_birth = ?3
                  AND sex_reference_context = ?4
                  AND external_identifier = ?5 AND created_at = ?6
                  AND updated_at = ?6 AND is_archived = 0
                  AND archived_at IS NULL
             )",
            params![
                patient_id,
                fixture.patient.display_name,
                fixture.patient.date_of_birth,
                fixture.patient.sex_reference_context,
                fixture.patient.external_identifier,
                patient_timestamp,
            ],
            seed_version,
            &format!("patient '{}'", fixture.patient.source_key),
        )?;
        ensure_count(
            transaction,
            "SELECT COUNT(*) FROM demo_patient_profiles WHERE patient_id = ?1",
            [&patient_id],
            fixture.profile_ids.len(),
            seed_version,
            &format!("profile count for patient '{}'", fixture.patient.source_key),
        )?;
        ensure_count(
            transaction,
            "SELECT COUNT(*) FROM patient_body_measurements WHERE patient_id = ?1",
            [&patient_id],
            fixture.body_measurements.len(),
            seed_version,
            &format!(
                "body measurement count for patient '{}'",
                fixture.patient.source_key
            ),
        )?;
        ensure_count(
            transaction,
            "SELECT COUNT(*) FROM laboratory_reports WHERE patient_id = ?1",
            [&patient_id],
            fixture.reports.len(),
            seed_version,
            &format!("report count for patient '{}'", fixture.patient.source_key),
        )?;

        for report in &fixture.reports {
            verify_report(transaction, approved, approved_fixture, &patient_id, report)?;
        }
    }
    ensure_no_foreign_key_violations(transaction)
}

fn verify_report(
    transaction: &Transaction<'_>,
    approved: &ApprovedFixtureSet,
    approved_fixture: &crate::demo_fixtures::ApprovedFixture,
    patient_id: &str,
    report: &crate::demo_fixtures::FixtureReport,
) -> Result<(), DemoSeedError> {
    let seed_version = approved.manifest.seed_version.as_str();
    let entry = &approved_fixture.entry;
    let report_id = stable_id(&[
        seed_version,
        entry.fixture_id.as_str(),
        "report",
        report.source_key.as_str(),
    ]);
    let document_id = stable_id(&[
        seed_version,
        entry.fixture_id.as_str(),
        "document",
        report.source_key.as_str(),
    ]);
    let extraction_id = stable_id(&[
        seed_version,
        entry.fixture_id.as_str(),
        "extraction",
        report.source_key.as_str(),
    ]);
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM laboratory_reports
            WHERE id = ?1 AND patient_id = ?2 AND laboratory_name = ?3
              AND specimen_collected_at = ?4 AND laboratory_received_at = ?5
              AND report_released_at = ?6 AND revision_number = ?7
              AND imported_at = ?8
         )",
        params![
            report_id,
            patient_id,
            report.laboratory_name,
            report.specimen_collected_at,
            report.laboratory_received_at,
            report.report_released_at,
            report.revision_number,
            report.imported_at,
        ],
        seed_version,
        &format!("report '{}'", report.source_key),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM original_documents
            WHERE id = ?1 AND report_id = ?2
              AND source_type = 'approved-demo-fixture'
              AND original_file_name = ?3 AND media_type = 'application/json'
              AND checksum_algorithm = 'SHA-256' AND content_checksum = ?4
              AND storage_path = ?5 AND byte_size = ?6 AND recorded_at = ?7
         )",
        params![
            document_id,
            report_id,
            entry.path,
            entry.sha256,
            format!("embedded://fixtures/demo_seed/v1/{}", entry.path),
            i64::try_from(approved_fixture.content.len()).map_err(|_| {
                conflict(
                    seed_version,
                    "fixture byte size exceeds SQLite integer range",
                )
            })?,
            report.imported_at,
        ],
        seed_version,
        &format!("original document for report '{}'", report.source_key),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM demo_seed_documents
            WHERE seed_version = ?1 AND fixture_id = ?2
              AND original_document_id = ?3
         )",
        params![seed_version, entry.fixture_id, document_id],
        seed_version,
        &format!("seed document mapping for report '{}'", report.source_key),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM extraction_versions
            WHERE id = ?1 AND report_id = ?2 AND original_document_id = ?3
              AND version_number = 1 AND extractor_id = ?4
              AND extractor_version = ?5 AND extracted_at = ?6
         )",
        params![
            extraction_id,
            report_id,
            document_id,
            SEED_EXTRACTOR_ID,
            SEED_EXTRACTOR_VERSION,
            report.imported_at,
        ],
        seed_version,
        &format!("extraction version for report '{}'", report.source_key),
    )?;
    ensure_count(
        transaction,
        "SELECT COUNT(*) FROM original_values WHERE report_id = ?1",
        [&report_id],
        report.values.len(),
        seed_version,
        &format!("original value count for report '{}'", report.source_key),
    )?;

    for value in &report.values {
        verify_value(
            transaction,
            seed_version,
            entry.fixture_id.as_str(),
            report,
            value,
            &report_id,
            &document_id,
            &extraction_id,
        )?;
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn verify_value(
    transaction: &Transaction<'_>,
    seed_version: &str,
    fixture_id: &str,
    report: &crate::demo_fixtures::FixtureReport,
    value: &crate::demo_fixtures::FixtureValue,
    report_id: &str,
    document_id: &str,
    extraction_id: &str,
) -> Result<(), DemoSeedError> {
    let location_id = stable_id(&[
        seed_version,
        fixture_id,
        "location",
        report.source_key.as_str(),
        value.source_key.as_str(),
    ]);
    let original_value_id = stable_id(&[
        seed_version,
        fixture_id,
        "original-value",
        report.source_key.as_str(),
        value.source_key.as_str(),
    ]);
    let extracted_value_id = stable_id(&[
        seed_version,
        fixture_id,
        "extracted-value",
        report.source_key.as_str(),
        value.source_key.as_str(),
    ]);
    let working_value_id = stable_id(&[
        seed_version,
        fixture_id,
        "working-value",
        report.source_key.as_str(),
        value.source_key.as_str(),
    ]);
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM provenance_locations
            WHERE id = ?1 AND report_id = ?2 AND original_document_id = ?3
              AND locator_kind = 'json_path' AND page_number IS NULL
              AND row_number IS NULL AND column_name IS NULL
              AND json_path = ?4 AND text_start_offset IS NULL
              AND text_end_offset IS NULL AND bounding_box_json IS NULL
              AND text_excerpt = ?5 AND recorded_at = ?6
         )",
        params![
            location_id,
            report_id,
            document_id,
            value.source_location.json_path,
            value.source_location.text_excerpt,
            report.imported_at,
        ],
        seed_version,
        &format!(
            "provenance for '{}:{}'",
            report.source_key, value.source_key
        ),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM original_values
            WHERE id = ?1 AND report_id = ?2 AND original_document_id = ?3
              AND provenance_location_id = ?4 AND source_parameter_name = ?5
              AND original_value_text = ?6 AND original_unit = ?7
              AND original_reference_text = ?8 AND original_flag IS NULL
              AND original_material IS NULL AND original_method IS NULL
              AND recorded_at = ?9
         )",
        params![
            original_value_id,
            report_id,
            document_id,
            location_id,
            value.original_parameter_name,
            value.original_value,
            value.unit,
            value.reference_range,
            report.imported_at,
        ],
        seed_version,
        &format!(
            "original value '{}:{}'",
            report.source_key, value.source_key
        ),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM extracted_values
            WHERE id = ?1 AND report_id = ?2 AND original_document_id = ?3
              AND extraction_version_id = ?4 AND original_value_id = ?5
              AND extracted_parameter_name = ?6 AND numeric_value_text = ?7
              AND text_value IS NULL AND extracted_unit = ?8
              AND reference_lower_text IS NULL AND reference_upper_text IS NULL
              AND reference_rule_text = ?9 AND extracted_flag IS NULL
              AND extracted_material IS NULL AND extracted_method IS NULL
              AND confidence_value IS NULL AND confidence_scheme IS NULL
              AND recorded_at = ?10
         )",
        params![
            extracted_value_id,
            report_id,
            document_id,
            extraction_id,
            original_value_id,
            value.original_parameter_name,
            value.original_value,
            value.unit,
            value.reference_range,
            report.imported_at,
        ],
        seed_version,
        &format!(
            "extracted value '{}:{}'",
            report.source_key, value.source_key
        ),
    )?;
    ensure_exists(
        transaction,
        "SELECT EXISTS(
            SELECT 1 FROM confirmed_working_values
            WHERE id = ?1 AND original_value_id = ?2 AND extracted_value_id = ?3
              AND version_number = 1 AND parameter_name = ?4
              AND numeric_value_text = ?5 AND text_value IS NULL AND unit = ?6
              AND reference_lower_text IS NULL AND reference_upper_text IS NULL
              AND reference_rule_text = ?7 AND supplied_flag IS NULL
              AND material IS NULL AND method IS NULL
              AND confirmation_kind = 'explicit' AND confirmed_at = ?8
              AND recorded_at = ?8
         )",
        params![
            working_value_id,
            original_value_id,
            extracted_value_id,
            value.original_parameter_name,
            value.original_value,
            value.unit,
            value.reference_range,
            report.imported_at,
        ],
        seed_version,
        &format!("working value '{}:{}'", report.source_key, value.source_key),
    )?;
    Ok(())
}

fn ensure_exists<P: Params>(
    transaction: &Transaction<'_>,
    sql: &str,
    parameters: P,
    seed_version: &str,
    description: &str,
) -> Result<(), DemoSeedError> {
    let exists = transaction
        .query_row(sql, parameters, |row| row.get::<_, bool>(0))
        .map_err(persistence_error)?;
    if !exists {
        return Err(conflict(
            seed_version,
            &format!("{description} no longer matches the approved fixture"),
        ));
    }
    Ok(())
}

fn ensure_count<P: Params>(
    transaction: &Transaction<'_>,
    sql: &str,
    parameters: P,
    expected: usize,
    seed_version: &str,
    description: &str,
) -> Result<(), DemoSeedError> {
    let actual = transaction
        .query_row(sql, parameters, |row| row.get::<_, i64>(0))
        .map_err(persistence_error)?;
    let expected = i64::try_from(expected).map_err(|_| {
        conflict(
            seed_version,
            "expected seed count exceeds SQLite integer range",
        )
    })?;
    if actual != expected {
        return Err(conflict(
            seed_version,
            &format!("{description} is {actual}, expected {expected}"),
        ));
    }
    Ok(())
}

fn ensure_no_foreign_key_violations(transaction: &Transaction<'_>) -> Result<(), DemoSeedError> {
    let mut statement = transaction
        .prepare("PRAGMA foreign_key_check")
        .map_err(persistence_error)?;
    let mut rows = statement.query([]).map_err(persistence_error)?;
    if rows.next().map_err(persistence_error)?.is_some() {
        return Err(DemoSeedError::Persistence(
            "foreign-key validation reported a violation".to_owned(),
        ));
    }
    Ok(())
}

fn stable_id(parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update((part.len() as u64).to_be_bytes());
        hasher.update(part.as_bytes());
    }
    let digest = hasher.finalize();
    let mut bytes = [0_u8; 16];
    bytes.copy_from_slice(&digest[..16]);
    bytes[6] = (bytes[6] & 0x0f) | 0x80;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    Uuid::from_bytes(bytes).to_string()
}

fn conflict(seed_version: &str, reason: &str) -> DemoSeedError {
    DemoSeedError::Conflict {
        seed_version: seed_version.to_owned(),
        reason: reason.to_owned(),
    }
}

fn persistence_error(error: rusqlite::Error) -> DemoSeedError {
    DemoSeedError::Persistence(error.to_string())
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use uuid::Uuid;

    use super::{apply, DemoSeedError};
    use crate::persistence::PatientRepository;

    fn count(connection: &Connection, table: &str) -> i64 {
        connection
            .query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .expect("row count")
    }

    fn seeded_ids(connection: &Connection) -> Vec<String> {
        let mut statement = connection
            .prepare(
                "SELECT id FROM patients WHERE external_identifier LIKE 'DEMO-%'
                 UNION ALL SELECT id FROM laboratory_reports
                 UNION ALL SELECT id FROM original_documents
                 UNION ALL SELECT id FROM provenance_locations
                 UNION ALL SELECT id FROM original_values
                 UNION ALL SELECT id FROM extraction_versions
                 UNION ALL SELECT id FROM extracted_values
                 UNION ALL SELECT id FROM confirmed_working_values
                 ORDER BY 1",
            )
            .expect("prepare seeded IDs");
        statement
            .query_map([], |row| row.get::<_, String>(0))
            .expect("query seeded IDs")
            .collect::<Result<Vec<_>, _>>()
            .expect("collect seeded IDs")
    }

    #[test]
    fn seeds_an_empty_database_with_confirmed_related_data() {
        let mut repository = PatientRepository::in_memory().expect("empty database");

        apply(&mut repository).expect("apply demo seed");

        assert_eq!(count(repository.connection(), "patients"), 3);
        assert_eq!(count(repository.connection(), "laboratory_reports"), 7);
        assert_eq!(count(repository.connection(), "original_documents"), 7);
        assert_eq!(count(repository.connection(), "provenance_locations"), 86);
        assert_eq!(count(repository.connection(), "original_values"), 86);
        assert_eq!(count(repository.connection(), "extraction_versions"), 7);
        assert_eq!(count(repository.connection(), "extracted_values"), 86);
        assert_eq!(
            count(repository.connection(), "confirmed_working_values"),
            86
        );
        assert_eq!(count(repository.connection(), "demo_seed_runs"), 1);
        assert_eq!(count(repository.connection(), "demo_seed_fixtures"), 3);
        assert_eq!(count(repository.connection(), "demo_seed_documents"), 7);
        assert_eq!(
            count(repository.connection(), "patient_body_measurements"),
            2
        );
        assert_eq!(count(repository.connection(), "demo_patient_profiles"), 10);
        let explicit_count = repository
            .connection()
            .query_row(
                "SELECT COUNT(*) FROM confirmed_working_values
                 WHERE confirmation_kind = 'explicit'",
                [],
                |row| row.get::<_, i64>(0),
            )
            .expect("explicit working values");
        assert_eq!(explicit_count, 86);
        let violations = repository
            .connection()
            .query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
                row.get::<_, i64>(0)
            })
            .expect("foreign-key violations");
        assert_eq!(violations, 0);
    }

    #[test]
    fn repeated_seed_is_idempotent() {
        let mut repository = PatientRepository::in_memory().expect("empty database");
        apply(&mut repository).expect("first seed");
        let ids_before = seeded_ids(repository.connection());

        apply(&mut repository).expect("repeated seed");

        assert_eq!(seeded_ids(repository.connection()), ids_before);
        assert_eq!(count(repository.connection(), "patients"), 3);
        assert_eq!(count(repository.connection(), "laboratory_reports"), 7);
        assert_eq!(
            count(repository.connection(), "confirmed_working_values"),
            86
        );
        assert_eq!(count(repository.connection(), "demo_seed_runs"), 1);
    }

    #[test]
    fn stable_ids_match_across_independent_databases() {
        let mut first = PatientRepository::in_memory().expect("first database");
        let mut second = PatientRepository::in_memory().expect("second database");
        apply(&mut first).expect("seed first database");
        apply(&mut second).expect("seed second database");

        let first_ids = seeded_ids(first.connection());
        let second_ids = seeded_ids(second.connection());
        assert_eq!(first_ids, second_ids);
        assert_eq!(first_ids.len(), 368);
        assert!(first_ids.iter().all(|id| Uuid::parse_str(id).is_ok()));
    }

    #[test]
    fn changed_seeded_data_is_rejected_without_being_overwritten() {
        let mut repository = PatientRepository::in_memory().expect("empty database");
        apply(&mut repository).expect("first seed");
        repository
            .connection()
            .execute(
                "UPDATE patients
                 SET display_name = 'Locally changed demo record'
                 WHERE external_identifier = 'DEMO-EVA'",
                [],
            )
            .expect("change seeded patient");

        assert!(matches!(
            apply(&mut repository),
            Err(DemoSeedError::Conflict { .. })
        ));
        let preserved_change = repository
            .connection()
            .query_row(
                "SELECT display_name FROM patients
                 WHERE external_identifier = 'DEMO-EVA'",
                [],
                |row| row.get::<_, String>(0),
            )
            .expect("changed patient");
        assert_eq!(preserved_change, "Locally changed demo record");
    }
}
