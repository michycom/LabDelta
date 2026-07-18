# UI Specification

## Global dashboard

Header:

- LabDelta;
- **Quick patient selection**;
- Import;
- settings/help.

Priority table is sorted descending by a transparent, non-diagnostic attention score.

Columns:

- patient;
- latest report;
- parameter;
- current value;
- reference status and position;
- previous comparable value;
- absolute/percentage delta;
- short-term direction;
- longitudinal tendency;
- all relevant profile tags.

Severe patients may expand into multiple rows. Profile assignments can overlap.

## Patient workspace

For each value show:

- current value and unit;
- supplied reference interval;
- below/within/above/unavailable;
- lower/middle/upper interval third;
- previous comparable value;
- delta;
- risen/fallen/stable/no comparison;
- repeatedly rising/repeatedly falling/stable/variable/insufficient data.

## Import

Import starts only from a preselected patient.

Double identity check:

1. manually selected target patient;
2. identity extracted from the report.

Mismatch or ambiguity blocks persistence until explicitly resolved.

## Required dialogs/states

New patient, quick selection, source selection, parsing, identity review, value review, duplicate warning, unsupported scanned PDF, unit ambiguity, unknown parameter, changed interval, source viewer, deletion, empty states, and validation errors.

## Mockups

- `mockups/dashboard-global-overview.png`
- `mockups/patient-detail-and-import.png`
