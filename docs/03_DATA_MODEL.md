# Data Model

## Patient

UUID, display name, date of birth, sex/reference context, optional external identifier, timestamps.

## LaboratoryReport

UUID, patient UUID, sample/report date, laboratory, source type/name/hash/path, extracted identity, identity-match status, manual confirmation, import timestamp.

## LaboratoryResult

UUID, report UUID, source parameter name, optional canonical parameter ID, display name, numeric/text value, unit, supplied reference bounds/rule/flag, source page or row, parser confidence, review status, comparison eligibility.

## LaboratoryProfile

Stable ID, name, description, version, provenance.

## ProfileMembership

Many-to-many relationship: profile ID, parameter ID, role (`core`, `supporting`, `context`), display order.

## Safety

Raw imports are immutable. Source names are preserved. Ambiguous mappings require review. Reports cannot silently change patient assignment.
