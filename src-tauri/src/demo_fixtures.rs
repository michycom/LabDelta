use std::collections::HashSet;

use serde::Deserialize;
use sha2::{Digest, Sha256};
use thiserror::Error;

pub(crate) const DEMO_MARKER: &str = "LABDELTA_SYNTHETIC_DEMO_V1";
const SUPPORTED_MANIFEST_VERSION: &str = "1";
const SUPPORTED_FIXTURE_SCHEMA_VERSION: &str = "1";
const MANIFEST_JSON: &str = include_str!("../../fixtures/demo_seed/v1/manifest.json");

#[derive(Clone, Copy)]
struct EmbeddedSource<'a> {
    path: &'a str,
    content: &'a str,
}

const EMBEDDED_SOURCES: &[EmbeddedSource<'static>] = &[
    EmbeddedSource {
        path: "elio-morgen.json",
        content: include_str!("../../fixtures/demo_seed/v1/elio-morgen.json"),
    },
    EmbeddedSource {
        path: "nova-linden.json",
        content: include_str!("../../fixtures/demo_seed/v1/nova-linden.json"),
    },
    EmbeddedSource {
        path: "tarin-vale.json",
        content: include_str!("../../fixtures/demo_seed/v1/tarin-vale.json"),
    },
];

#[derive(Debug, Clone)]
pub(crate) struct ApprovedFixtureSet {
    pub manifest: FixtureManifest,
    pub manifest_sha256: String,
    pub fixtures: Vec<ApprovedFixture>,
}

#[derive(Debug, Clone)]
pub(crate) struct ApprovedFixture {
    pub entry: ManifestFixture,
    pub content: String,
    pub fixture: DemoFixture,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FixtureManifest {
    pub manifest_version: String,
    pub seed_version: String,
    pub demo_marker: String,
    pub fixtures: Vec<ManifestFixture>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct ManifestFixture {
    pub fixture_id: String,
    pub fixture_version: String,
    pub demo_marker: String,
    pub path: String,
    pub sha256: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct DemoFixture {
    pub schema_version: String,
    pub fixture_id: String,
    pub fixture_version: String,
    pub demo_marker: String,
    pub source_notice: String,
    pub patient: FixturePatient,
    pub reports: Vec<FixtureReport>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FixturePatient {
    pub source_key: String,
    pub display_name: String,
    pub date_of_birth: String,
    pub external_identifier: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FixtureReport {
    pub source_key: String,
    pub laboratory_name: String,
    pub specimen_collected_at: String,
    pub laboratory_received_at: String,
    pub report_released_at: String,
    pub revision_number: String,
    pub imported_at: String,
    pub values: Vec<FixtureValue>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FixtureValue {
    pub source_key: String,
    pub original_parameter_name: String,
    pub original_value: String,
    pub unit: String,
    pub reference_range: String,
    pub confirmation: ConfirmationKind,
    pub source_location: FixtureSourceLocation,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ConfirmationKind {
    Explicit,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FixtureSourceLocation {
    pub json_path: String,
    pub text_excerpt: String,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub(crate) enum FixtureError {
    #[error("Fixture manifest is invalid: {0}")]
    InvalidManifest(String),
    #[error("Fixture '{0}' is not an embedded approved source")]
    UnknownFixture(String),
    #[error("Fixture '{fixture_id}' checksum mismatch: expected {expected}, got {actual}")]
    ChecksumMismatch {
        fixture_id: String,
        expected: String,
        actual: String,
    },
    #[error("Fixture '{fixture_id}' is invalid: {reason}")]
    InvalidFixture { fixture_id: String, reason: String },
}

pub(crate) fn approved_fixtures() -> Result<ApprovedFixtureSet, FixtureError> {
    validate_fixture_set(MANIFEST_JSON, EMBEDDED_SOURCES)
}

pub(crate) fn sha256_hex(content: &[u8]) -> String {
    let digest = Sha256::digest(content);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn validate_fixture_set(
    manifest_json: &str,
    sources: &[EmbeddedSource<'_>],
) -> Result<ApprovedFixtureSet, FixtureError> {
    let manifest: FixtureManifest = serde_json::from_str(manifest_json)
        .map_err(|error| FixtureError::InvalidManifest(error.to_string()))?;
    validate_manifest(&manifest)?;

    let mut seen_fixture_ids = HashSet::new();
    let mut seen_paths = HashSet::new();
    let mut fixtures = Vec::with_capacity(manifest.fixtures.len());
    for entry in &manifest.fixtures {
        if !seen_fixture_ids.insert(entry.fixture_id.as_str()) {
            return Err(FixtureError::InvalidManifest(format!(
                "duplicate fixture ID '{}'",
                entry.fixture_id
            )));
        }
        if !seen_paths.insert(entry.path.as_str()) {
            return Err(FixtureError::InvalidManifest(format!(
                "duplicate fixture path '{}'",
                entry.path
            )));
        }
        validate_manifest_entry(entry)?;

        let source = sources
            .iter()
            .find(|source| source.path == entry.path)
            .ok_or_else(|| FixtureError::UnknownFixture(entry.path.clone()))?;
        let actual_checksum = sha256_hex(source.content.as_bytes());
        if actual_checksum != entry.sha256 {
            return Err(FixtureError::ChecksumMismatch {
                fixture_id: entry.fixture_id.clone(),
                expected: entry.sha256.clone(),
                actual: actual_checksum,
            });
        }

        let fixture: DemoFixture =
            serde_json::from_str(source.content).map_err(|error| FixtureError::InvalidFixture {
                fixture_id: entry.fixture_id.clone(),
                reason: error.to_string(),
            })?;
        validate_fixture(entry, &fixture)?;
        fixtures.push(ApprovedFixture {
            entry: entry.clone(),
            content: source.content.to_owned(),
            fixture,
        });
    }

    if fixtures.len() != sources.len() {
        return Err(FixtureError::InvalidManifest(
            "every embedded source must appear exactly once in the manifest".to_owned(),
        ));
    }

    Ok(ApprovedFixtureSet {
        manifest_sha256: sha256_hex(manifest_json.as_bytes()),
        manifest,
        fixtures,
    })
}

fn validate_manifest(manifest: &FixtureManifest) -> Result<(), FixtureError> {
    if manifest.manifest_version != SUPPORTED_MANIFEST_VERSION {
        return Err(FixtureError::InvalidManifest(format!(
            "unsupported manifest version '{}'",
            manifest.manifest_version
        )));
    }
    if manifest.seed_version.trim().is_empty() {
        return Err(FixtureError::InvalidManifest(
            "seed version is required".to_owned(),
        ));
    }
    if manifest.demo_marker != DEMO_MARKER {
        return Err(FixtureError::InvalidManifest(
            "demo marker does not match the application marker".to_owned(),
        ));
    }
    if manifest.fixtures.is_empty() {
        return Err(FixtureError::InvalidManifest(
            "at least one fixture is required".to_owned(),
        ));
    }
    Ok(())
}

fn validate_manifest_entry(entry: &ManifestFixture) -> Result<(), FixtureError> {
    if entry.fixture_id.trim().is_empty() || entry.fixture_version.trim().is_empty() {
        return Err(FixtureError::InvalidManifest(
            "fixture ID and version are required".to_owned(),
        ));
    }
    if entry.demo_marker != DEMO_MARKER {
        return Err(FixtureError::InvalidManifest(format!(
            "fixture '{}' has an invalid demo marker",
            entry.fixture_id
        )));
    }
    if entry.sha256.len() != 64
        || !entry
            .sha256
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    {
        return Err(FixtureError::InvalidManifest(format!(
            "fixture '{}' has an invalid SHA-256 value",
            entry.fixture_id
        )));
    }
    Ok(())
}

fn validate_fixture(entry: &ManifestFixture, fixture: &DemoFixture) -> Result<(), FixtureError> {
    let invalid = |reason: &str| FixtureError::InvalidFixture {
        fixture_id: entry.fixture_id.clone(),
        reason: reason.to_owned(),
    };
    if fixture.schema_version != SUPPORTED_FIXTURE_SCHEMA_VERSION {
        return Err(invalid("unsupported fixture schema version"));
    }
    if fixture.fixture_id != entry.fixture_id
        || fixture.fixture_version != entry.fixture_version
        || fixture.demo_marker != entry.demo_marker
    {
        return Err(invalid("fixture identity does not match the manifest"));
    }
    if fixture.source_notice.trim().is_empty()
        || fixture.patient.source_key.trim().is_empty()
        || fixture.patient.display_name.trim().is_empty()
        || fixture.patient.date_of_birth.trim().is_empty()
        || fixture.patient.external_identifier.trim().is_empty()
        || fixture.reports.is_empty()
    {
        return Err(invalid("required fixture content is missing"));
    }

    let mut report_keys = HashSet::new();
    let mut previous_specimen_collected_at: Option<&str> = None;
    for report in &fixture.reports {
        if !report_keys.insert(report.source_key.as_str())
            || report.laboratory_name.trim().is_empty()
            || report.specimen_collected_at.trim().is_empty()
            || report.laboratory_received_at.trim().is_empty()
            || report.report_released_at.trim().is_empty()
            || report.revision_number.trim().is_empty()
            || report.imported_at.trim().is_empty()
            || report.values.is_empty()
        {
            return Err(invalid(
                "report keys and required fields must be complete and unique",
            ));
        }
        if previous_specimen_collected_at
            .is_some_and(|previous| report.specimen_collected_at.as_str() <= previous)
        {
            return Err(invalid(
                "reports must be strictly ordered by specimen collection timestamp",
            ));
        }
        previous_specimen_collected_at = Some(report.specimen_collected_at.as_str());

        let mut value_keys = HashSet::new();
        for value in &report.values {
            if !value_keys.insert(value.source_key.as_str())
                || value.original_parameter_name.trim().is_empty()
                || value.original_value.trim().is_empty()
                || value.unit.trim().is_empty()
                || value.reference_range.trim().is_empty()
                || value.confirmation != ConfirmationKind::Explicit
                || value.source_location.json_path.trim().is_empty()
                || value.source_location.text_excerpt.trim().is_empty()
            {
                return Err(invalid(
                    "value keys, explicit confirmation, and source fields are required",
                ));
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        approved_fixtures, validate_fixture_set, EmbeddedSource, FixtureError, MANIFEST_JSON,
    };

    #[test]
    fn validates_the_embedded_manifest_and_fixture_set() {
        let approved = approved_fixtures().expect("approved embedded fixtures");

        assert_eq!(approved.manifest.manifest_version, "1");
        assert_eq!(approved.manifest.seed_version, "contest-demo-v1");
        assert_eq!(approved.fixtures.len(), 3);
        assert_eq!(
            approved
                .fixtures
                .iter()
                .map(|fixture| fixture.fixture.reports.len())
                .sum::<usize>(),
            7
        );
        assert_eq!(approved.manifest_sha256.len(), 64);
    }

    #[test]
    fn rejects_a_manipulated_fixture_fail_closed() {
        let source = include_str!("../../fixtures/demo_seed/v1/elio-morgen.json");
        let manipulated = source.replace("Elio Morgen", "Elio Changed");
        let sources = [
            EmbeddedSource {
                path: "elio-morgen.json",
                content: &manipulated,
            },
            EmbeddedSource {
                path: "nova-linden.json",
                content: include_str!("../../fixtures/demo_seed/v1/nova-linden.json"),
            },
            EmbeddedSource {
                path: "tarin-vale.json",
                content: include_str!("../../fixtures/demo_seed/v1/tarin-vale.json"),
            },
        ];

        assert!(matches!(
            validate_fixture_set(MANIFEST_JSON, &sources),
            Err(FixtureError::ChecksumMismatch { .. })
        ));
    }

    #[test]
    fn rejects_a_manifest_path_that_is_not_embedded() {
        let changed_manifest = MANIFEST_JSON.replace("elio-morgen.json", "unknown.json");

        assert!(matches!(
            validate_fixture_set(&changed_manifest, super::EMBEDDED_SOURCES),
            Err(FixtureError::UnknownFixture(path)) if path == "unknown.json"
        ));
    }
}
