use std::cmp::Ordering;
use std::collections::HashMap;

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use thiserror::Error;

pub(crate) const REFERENCE_RULE_ID: &str = "report-reference-interval";
pub(crate) const REFERENCE_RULE_VERSION: u32 = 1;
pub(crate) const COMPARISON_RULE_ID: &str = "exact-parameter-unit-previous-report";
pub(crate) const COMPARISON_RULE_VERSION: u32 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum DashboardFilter {
    All,
    OutsideReference,
    Changed,
    LongitudinalData,
}

impl TryFrom<&str> for DashboardFilter {
    type Error = DashboardError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "all" => Ok(Self::All),
            "outsideReference" => Ok(Self::OutsideReference),
            "changed" => Ok(Self::Changed),
            "longitudinalData" => Ok(Self::LongitudinalData),
            other => Err(DashboardError::InvalidFilter(other.to_owned())),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum ReferenceStatus {
    Below,
    Within,
    Above,
    NotAssessable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum MathematicalDirection {
    Higher,
    Lower,
    Equal,
    NoComparison,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DashboardView {
    pub filter: String,
    pub sort_explanation: String,
    pub patients: Vec<DashboardPatient>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DashboardPatient {
    pub id: String,
    pub display_name: String,
    pub latest_report_id: String,
    pub latest_report_date: String,
    pub report_count: u32,
    pub confirmed_value_count: u32,
    pub reference_counts: ReferenceCounts,
    pub profiles: Vec<DashboardProfile>,
    pub highlights: Vec<DashboardValueDetail>,
    pub has_changed: bool,
    pub has_longitudinal_data: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ReferenceCounts {
    pub below: u32,
    pub within: u32,
    pub above: u32,
    pub not_assessable: u32,
}

impl ReferenceCounts {
    fn outside(&self) -> u32 {
        self.below + self.above
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DashboardProfile {
    pub id: String,
    pub version: u32,
    pub name: String,
    pub assigned_parameter_count: u32,
    pub present_parameter_count: u32,
    pub outside_reference_count: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DashboardValueDetail {
    pub working_value_id: String,
    pub parameter_name: String,
    pub current_value: String,
    pub unit: Option<String>,
    pub previous_value: Option<String>,
    pub absolute_difference: Option<String>,
    pub relative_difference_percent: Option<String>,
    pub direction: MathematicalDirection,
    pub supplied_reference: Option<String>,
    pub reference_status: ReferenceStatus,
    pub current_report_id: String,
    pub current_report_date: String,
    pub previous_report_id: Option<String>,
    pub previous_report_date: Option<String>,
    pub profile_tags: Vec<String>,
    pub original_parameter_name: String,
    pub original_document_name: String,
    pub provenance_label: String,
    pub provenance_excerpt: Option<String>,
    pub reference_rule_id: &'static str,
    pub reference_rule_version: u32,
    pub comparison_rule_id: &'static str,
    pub comparison_rule_version: u32,
    #[serde(skip)]
    relative_magnitude: Option<f64>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub(crate) enum DashboardError {
    #[error("Unknown dashboard filter '{0}'")]
    InvalidFilter(String),
    #[error("Dashboard persistence failed: {0}")]
    Persistence(String),
    #[error("Stored dashboard data is invalid: {0}")]
    InvalidStoredData(String),
}

pub(crate) fn load_dashboard(
    connection: &Connection,
    filter: DashboardFilter,
) -> Result<DashboardView, DashboardError> {
    let mut patient_statement = connection
        .prepare(
            "SELECT DISTINCT patient.id, patient.display_name
             FROM patients AS patient
             JOIN laboratory_reports AS report ON report.patient_id = patient.id
             JOIN original_documents AS document ON document.report_id = report.id
             JOIN demo_seed_documents AS seed_document ON seed_document.original_document_id = document.id",
        )
        .map_err(persistence_error)?;
    let patient_rows = patient_statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    let mut patients = patient_rows
        .into_iter()
        .map(|(id, display_name)| build_patient(connection, id, display_name))
        .collect::<Result<Vec<_>, _>>()?;
    patients.retain(|patient| match filter {
        DashboardFilter::All => true,
        DashboardFilter::OutsideReference => patient.reference_counts.outside() > 0,
        DashboardFilter::Changed => patient.has_changed,
        DashboardFilter::LongitudinalData => patient.has_longitudinal_data,
    });
    patients.sort_by(patient_order);
    Ok(DashboardView {
        filter: match filter {
            DashboardFilter::All => "all",
            DashboardFilter::OutsideReference => "outsideReference",
            DashboardFilter::Changed => "changed",
            DashboardFilter::LongitudinalData => "longitudinalData",
        }
        .to_owned(),
        sort_explanation: "Outside supplied report reference first; then outside count descending, latest report date descending, patient name, and stable patient ID.".to_owned(),
        patients,
    })
}

fn build_patient(
    connection: &Connection,
    id: String,
    display_name: String,
) -> Result<DashboardPatient, DashboardError> {
    let reports = reports_for_patient(connection, &id)?;
    let latest = reports.last().ok_or_else(|| {
        DashboardError::InvalidStoredData(format!("patient '{id}' has no report"))
    })?;
    let latest_values = values_for_report(connection, &latest.id)?;
    let profile_defs = profiles_for_patient(connection, &id)?;
    let profile_tags = profile_tags_by_parameter(&profile_defs);
    let mut details = Vec::with_capacity(latest_values.len());
    let mut counts = ReferenceCounts::default();
    let mut has_changed = false;
    let mut comparable_parameters = 0_u32;
    for value in latest_values {
        let status = classify(&value.value, value.reference.as_deref());
        match status {
            ReferenceStatus::Below => counts.below += 1,
            ReferenceStatus::Within => counts.within += 1,
            ReferenceStatus::Above => counts.above += 1,
            ReferenceStatus::NotAssessable => counts.not_assessable += 1,
        }
        let previous = previous_value(connection, &id, latest, &value)?;
        let comparison = compare(
            &value.value,
            previous.as_ref().map(|item| item.value.as_str()),
        );
        if previous.is_some() {
            comparable_parameters += 1;
        }
        if !matches!(
            comparison.direction,
            MathematicalDirection::Equal | MathematicalDirection::NoComparison
        ) {
            has_changed = true;
        }
        details.push(DashboardValueDetail {
            working_value_id: value.working_id,
            parameter_name: value.parameter_name.clone(),
            current_value: value.value,
            unit: value.unit,
            previous_value: previous.as_ref().map(|item| item.value.clone()),
            absolute_difference: comparison.absolute,
            relative_difference_percent: comparison.relative,
            direction: comparison.direction,
            supplied_reference: value.reference,
            reference_status: status,
            current_report_id: latest.id.clone(),
            current_report_date: latest.date.clone(),
            previous_report_id: previous.as_ref().map(|item| item.report_id.clone()),
            previous_report_date: previous.as_ref().map(|item| item.report_date.clone()),
            profile_tags: profile_tags
                .get(&value.parameter_name)
                .cloned()
                .unwrap_or_default(),
            original_parameter_name: value.original_parameter_name,
            original_document_name: value.document_name,
            provenance_label: value.provenance_label,
            provenance_excerpt: value.provenance_excerpt,
            reference_rule_id: REFERENCE_RULE_ID,
            reference_rule_version: REFERENCE_RULE_VERSION,
            comparison_rule_id: COMPARISON_RULE_ID,
            comparison_rule_version: COMPARISON_RULE_VERSION,
            relative_magnitude: comparison.relative_magnitude,
        });
    }
    let statuses = details
        .iter()
        .map(|detail| (detail.parameter_name.as_str(), detail.reference_status))
        .collect::<HashMap<_, _>>();
    let profiles = profile_defs
        .into_iter()
        .map(|profile| DashboardProfile {
            id: profile.id,
            version: profile.version,
            name: profile.name,
            assigned_parameter_count: profile.parameters.len() as u32,
            present_parameter_count: profile
                .parameters
                .iter()
                .filter(|name| statuses.contains_key(name.as_str()))
                .count() as u32,
            outside_reference_count: profile
                .parameters
                .iter()
                .filter(|name| {
                    matches!(
                        statuses.get(name.as_str()),
                        Some(ReferenceStatus::Below | ReferenceStatus::Above)
                    )
                })
                .count() as u32,
        })
        .collect();
    details.retain(|detail| {
        matches!(
            detail.reference_status,
            ReferenceStatus::Below | ReferenceStatus::Above
        ) || !matches!(
            detail.direction,
            MathematicalDirection::Equal | MathematicalDirection::NoComparison
        )
    });
    details.sort_by(highlight_order);
    Ok(DashboardPatient {
        id,
        display_name,
        latest_report_id: latest.id.clone(),
        latest_report_date: latest.date.clone(),
        report_count: reports.len() as u32,
        confirmed_value_count: counts.below + counts.within + counts.above + counts.not_assessable,
        reference_counts: counts,
        profiles,
        highlights: details,
        has_changed,
        has_longitudinal_data: reports.len() >= 2 && comparable_parameters > 0,
    })
}

#[derive(Clone)]
struct ReportRow {
    id: String,
    date: String,
}

fn reports_for_patient(
    connection: &Connection,
    patient_id: &str,
) -> Result<Vec<ReportRow>, DashboardError> {
    let mut statement = connection
        .prepare(
            "SELECT report.id, report.specimen_collected_at
             FROM laboratory_reports AS report
             JOIN original_documents AS document ON document.report_id = report.id
             JOIN demo_seed_documents AS seed_document ON seed_document.original_document_id = document.id
             WHERE report.patient_id = ?1
             ORDER BY report.specimen_collected_at, report.laboratory_received_at,
                      report.report_released_at, report.revision_number, report.imported_at, report.id",
        )
        .map_err(persistence_error)?;
    let reports = statement
        .query_map([patient_id], |row| {
            Ok(ReportRow {
                id: row.get(0)?,
                date: row.get(1)?,
            })
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    Ok(reports)
}

struct ValueRow {
    working_id: String,
    parameter_name: String,
    value: String,
    unit: Option<String>,
    reference: Option<String>,
    original_parameter_name: String,
    document_name: String,
    provenance_label: String,
    provenance_excerpt: Option<String>,
}

fn values_for_report(
    connection: &Connection,
    report_id: &str,
) -> Result<Vec<ValueRow>, DashboardError> {
    let mut statement = connection
        .prepare(
            "SELECT working.id, working.parameter_name, working.numeric_value_text,
                    working.unit, original.original_reference_text,
                    original.source_parameter_name, document.original_file_name,
                    location.locator_kind, location.json_path, location.page_number,
                    location.row_number, location.column_name, location.text_excerpt
             FROM confirmed_working_values AS working
             JOIN original_values AS original ON original.id = working.original_value_id
             JOIN original_documents AS document ON document.id = original.original_document_id
             JOIN demo_seed_documents AS seed_document ON seed_document.original_document_id = document.id
             JOIN provenance_locations AS location ON location.id = original.provenance_location_id
             WHERE original.report_id = ?1 AND working.confirmation_kind = 'explicit'
               AND working.version_number = (
                   SELECT MAX(latest.version_number) FROM confirmed_working_values AS latest
                   WHERE latest.original_value_id = working.original_value_id
               )
             ORDER BY original.source_parameter_name COLLATE NOCASE, original.id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([report_id], |row| {
            let kind: String = row.get(7)?;
            let json_path: Option<String> = row.get(8)?;
            let page: Option<u32> = row.get(9)?;
            let row_number: Option<u32> = row.get(10)?;
            let column: Option<String> = row.get(11)?;
            let provenance_label = match kind.as_str() {
                "json_path" => format!("JSON path: {}", json_path.unwrap_or_default()),
                "page" => format!("Page: {}", page.unwrap_or_default()),
                "table_cell" => format!(
                    "Row {}, column {}",
                    row_number.unwrap_or_default(),
                    column.unwrap_or_default()
                ),
                _ => "Document source".to_owned(),
            };
            Ok(ValueRow {
                working_id: row.get(0)?,
                parameter_name: row.get(1)?,
                value: row.get(2)?,
                unit: row.get(3)?,
                reference: row.get(4)?,
                original_parameter_name: row.get(5)?,
                document_name: row.get(6)?,
                provenance_label,
                provenance_excerpt: row.get(12)?,
            })
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    Ok(rows)
}

struct PreviousValue {
    value: String,
    report_id: String,
    report_date: String,
}

fn previous_value(
    connection: &Connection,
    patient_id: &str,
    latest: &ReportRow,
    value: &ValueRow,
) -> Result<Option<PreviousValue>, DashboardError> {
    connection
        .query_row(
            "SELECT working.numeric_value_text, report.id, report.specimen_collected_at
             FROM confirmed_working_values AS working
             JOIN original_values AS original ON original.id = working.original_value_id
             JOIN laboratory_reports AS report ON report.id = original.report_id
             JOIN original_documents AS document ON document.id = original.original_document_id
             JOIN demo_seed_documents AS seed_document ON seed_document.original_document_id = document.id
             WHERE report.patient_id = ?1 AND report.specimen_collected_at < ?2
               AND working.parameter_name = ?3 AND working.unit IS ?4
               AND working.confirmation_kind = 'explicit'
               AND working.version_number = (
                   SELECT MAX(latest_working.version_number)
                   FROM confirmed_working_values AS latest_working
                   WHERE latest_working.original_value_id = working.original_value_id
               )
             ORDER BY report.specimen_collected_at DESC, report.laboratory_received_at DESC,
                      report.report_released_at DESC, report.revision_number DESC,
                      report.imported_at DESC, report.id DESC LIMIT 1",
            params![patient_id, latest.date, value.parameter_name, value.unit],
            |row| Ok(PreviousValue { value: row.get(0)?, report_id: row.get(1)?, report_date: row.get(2)? }),
        )
        .optional()
        .map_err(persistence_error)
}

struct ProfileDef {
    id: String,
    version: u32,
    name: String,
    parameters: Vec<String>,
}

fn profiles_for_patient(
    connection: &Connection,
    patient_id: &str,
) -> Result<Vec<ProfileDef>, DashboardError> {
    let mut statement = connection
        .prepare(
            "SELECT profile.id, profile.version, profile.name
             FROM demo_patient_profiles AS assignment
             JOIN laboratory_profiles AS profile ON profile.id = assignment.profile_id AND profile.version = assignment.profile_version
             WHERE assignment.patient_id = ?1 ORDER BY assignment.display_order, profile.id",
        )
        .map_err(persistence_error)?;
    let rows = statement
        .query_map([patient_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, u32>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(persistence_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(persistence_error)?;
    rows.into_iter()
        .map(|(id, version, name)| {
            let mut members = connection
                .prepare(
                    "SELECT parameter.canonical_display FROM profile_memberships AS membership
                     JOIN laboratory_parameters AS parameter ON parameter.id = membership.parameter_id AND parameter.version = membership.parameter_version
                     WHERE membership.profile_id = ?1 AND membership.profile_version = ?2
                     ORDER BY membership.display_order, parameter.id",
                )
                .map_err(persistence_error)?;
            let parameters = members
                .query_map(params![id, version], |row| row.get(0))
                .map_err(persistence_error)?
                .collect::<Result<Vec<_>, _>>()
                .map_err(persistence_error)?;
            Ok(ProfileDef { id, version, name, parameters })
        })
        .collect()
}

fn profile_tags_by_parameter(profiles: &[ProfileDef]) -> HashMap<String, Vec<String>> {
    let mut tags = HashMap::<String, Vec<String>>::new();
    for profile in profiles {
        for parameter in &profile.parameters {
            tags.entry(parameter.clone())
                .or_default()
                .push(profile.name.clone());
        }
    }
    tags
}

fn classify(value: &str, reference: Option<&str>) -> ReferenceStatus {
    let Ok(number) = value.parse::<f64>() else {
        return ReferenceStatus::NotAssessable;
    };
    let Some(reference) = reference.map(str::trim) else {
        return ReferenceStatus::NotAssessable;
    };
    if let Some(upper) = reference.strip_prefix('<') {
        return upper
            .trim()
            .parse::<f64>()
            .map_or(ReferenceStatus::NotAssessable, |limit| {
                if number < limit {
                    ReferenceStatus::Within
                } else {
                    ReferenceStatus::Above
                }
            });
    }
    if let Some(lower) = reference.strip_prefix('>') {
        return lower
            .trim()
            .parse::<f64>()
            .map_or(ReferenceStatus::NotAssessable, |limit| {
                if number > limit {
                    ReferenceStatus::Within
                } else {
                    ReferenceStatus::Below
                }
            });
    }
    let Some((lower, upper)) = reference.split_once('-') else {
        return ReferenceStatus::NotAssessable;
    };
    match (lower.trim().parse::<f64>(), upper.trim().parse::<f64>()) {
        (Ok(lower), Ok(upper)) if lower <= upper => {
            if number < lower {
                ReferenceStatus::Below
            } else if number > upper {
                ReferenceStatus::Above
            } else {
                ReferenceStatus::Within
            }
        }
        _ => ReferenceStatus::NotAssessable,
    }
}

struct Comparison {
    absolute: Option<String>,
    relative: Option<String>,
    relative_magnitude: Option<f64>,
    direction: MathematicalDirection,
}

fn compare(current: &str, previous: Option<&str>) -> Comparison {
    let (Ok(current), Some(Ok(previous))) =
        (current.parse::<f64>(), previous.map(str::parse::<f64>))
    else {
        return Comparison {
            absolute: None,
            relative: None,
            relative_magnitude: None,
            direction: MathematicalDirection::NoComparison,
        };
    };
    let difference = current - previous;
    let direction = if difference > 0.0 {
        MathematicalDirection::Higher
    } else if difference < 0.0 {
        MathematicalDirection::Lower
    } else {
        MathematicalDirection::Equal
    };
    let relative = (previous != 0.0).then(|| difference / previous * 100.0);
    Comparison {
        absolute: Some(format_number(difference)),
        relative: relative.map(format_number),
        relative_magnitude: relative.map(f64::abs),
        direction,
    }
}

fn format_number(value: f64) -> String {
    let normalized = if value.abs() < 0.000_000_1 {
        0.0
    } else {
        value
    };
    let formatted = format!("{normalized:.2}");
    formatted
        .trim_end_matches('0')
        .trim_end_matches('.')
        .to_owned()
}

fn patient_order(left: &DashboardPatient, right: &DashboardPatient) -> Ordering {
    let left_outside = left.reference_counts.outside();
    let right_outside = right.reference_counts.outside();
    right_outside
        .cmp(&left_outside)
        .then_with(|| right.latest_report_date.cmp(&left.latest_report_date))
        .then_with(|| left.display_name.cmp(&right.display_name))
        .then_with(|| left.id.cmp(&right.id))
}

fn highlight_order(left: &DashboardValueDetail, right: &DashboardValueDetail) -> Ordering {
    let left_outside = matches!(
        left.reference_status,
        ReferenceStatus::Below | ReferenceStatus::Above
    );
    let right_outside = matches!(
        right.reference_status,
        ReferenceStatus::Below | ReferenceStatus::Above
    );
    right_outside
        .cmp(&left_outside)
        .then_with(|| {
            right
                .relative_magnitude
                .partial_cmp(&left.relative_magnitude)
                .unwrap_or(Ordering::Equal)
        })
        .then_with(|| left.parameter_name.cmp(&right.parameter_name))
        .then_with(|| left.working_value_id.cmp(&right.working_value_id))
}

fn persistence_error(error: rusqlite::Error) -> DashboardError {
    DashboardError::Persistence(error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{
        load_dashboard, DashboardFilter, ReferenceStatus, COMPARISON_RULE_ID, REFERENCE_RULE_ID,
    };
    use crate::demo_seed;
    use crate::persistence::PatientRepository;

    fn repository() -> PatientRepository {
        let mut repository = PatientRepository::in_memory().expect("database");
        demo_seed::apply(&mut repository).expect("seed");
        repository
    }

    #[test]
    fn dashboard_is_sorted_and_uses_report_reference_rules() {
        let repository = repository();
        let dashboard =
            load_dashboard(repository.connection(), DashboardFilter::All).expect("dashboard");
        assert_eq!(dashboard.patients.len(), 3);
        assert_eq!(
            dashboard
                .patients
                .iter()
                .map(|patient| patient.display_name.as_str())
                .collect::<Vec<_>>(),
            ["Dirk Mayer", "Daniel Power", "Eva Mittel"]
        );
        assert_eq!(dashboard.patients[0].reference_counts.above, 4);
        assert_eq!(dashboard.patients[1].reference_counts.above, 1);
        assert_eq!(dashboard.patients[2].reference_counts.within, 8);
        assert_eq!(dashboard.patients[2].reference_counts.not_assessable, 0);
        assert!(dashboard
            .patients
            .iter()
            .flat_map(|patient| &patient.highlights)
            .all(|value| value.reference_rule_id == REFERENCE_RULE_ID
                && value.comparison_rule_id == COMPARISON_RULE_ID));
        assert!(dashboard.patients[0]
            .highlights
            .iter()
            .any(|value| value.parameter_name == "Fasting glucose"
                && value.reference_status == ReferenceStatus::Above));
    }

    #[test]
    fn dashboard_filters_are_deterministic() {
        let repository = repository();
        let outside = load_dashboard(repository.connection(), DashboardFilter::OutsideReference)
            .expect("outside");
        assert_eq!(
            outside
                .patients
                .iter()
                .map(|patient| patient.display_name.as_str())
                .collect::<Vec<_>>(),
            ["Dirk Mayer", "Daniel Power"]
        );
        let changed =
            load_dashboard(repository.connection(), DashboardFilter::Changed).expect("changed");
        assert_eq!(changed.patients.len(), 3);
        let longitudinal =
            load_dashboard(repository.connection(), DashboardFilter::LongitudinalData)
                .expect("longitudinal");
        assert_eq!(longitudinal.patients.len(), 3);
        assert!(longitudinal
            .patients
            .iter()
            .all(|patient| patient.has_longitudinal_data));
    }

    #[test]
    fn dashboard_profiles_come_from_versioned_assignments() {
        let repository = repository();
        let dashboard =
            load_dashboard(repository.connection(), DashboardFilter::All).expect("dashboard");
        let dirk = dashboard
            .patients
            .iter()
            .find(|patient| patient.display_name == "Dirk Mayer")
            .expect("Dirk");
        assert_eq!(
            dirk.profiles
                .iter()
                .map(|profile| (profile.name.as_str(), profile.version))
                .collect::<Vec<_>>(),
            [
                ("Small Blood Count", 1),
                ("Glucose Metabolism", 1),
                ("Lipid Profile", 1),
                ("Kidney Profile", 1)
            ]
        );
        assert_eq!(
            dirk.profiles
                .iter()
                .find(|profile| profile.name == "Lipid Profile")
                .expect("lipid")
                .present_parameter_count,
            3
        );
    }
}
