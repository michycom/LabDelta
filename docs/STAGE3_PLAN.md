# Stage 3 Plan

## Purpose and planning basis

This document describes the current implementation state and the recommended path from the completed patient-management work to Stage 3. It does not change the frozen product requirements.

Planning baseline:

- repository state at commit `7f6b23a9f99fe9a5b1a8918607ee21195f197a61`;
- the documents in `docs/` remain authoritative;
- Stage 3 in `docs/12_CODEX_MASTER_PROMPT.md` is the deterministic analysis engine and laboratory profiles;
- functional file import, identity review, charts, and source viewing remain assigned to later stages;
- all runtime processing remains local and offline;
- no diagnosis, probability, causal claim, treatment recommendation, additional-test recommendation, runtime AI, telemetry, or patient-data network request may be introduced.

## Executive summary

LabDelta currently consists of a working Tauri 2 application shell, a React/TypeScript frontend, and a Rust/SQLite patient repository. Patient records can be listed, created, selected, edited, and deleted through Tauri commands. Stable UUIDs, input validation, confirmation before deletion, persistence tests, and frontend interaction tests exist.

The laboratory dashboard, patient comparison workspace, profile overview, trend chart, source preview, and import panel are still driven by static TypeScript demonstration data. There are no persisted laboratory reports or results and no analysis engine.

There is a gap between the master stage definition and the implementation history: the master prompt assigns the complete SQLite data model and reproducible JSON, CSV, and selectable-text PDF demonstration data to Stage 2. The completed Stage 2 work implements only patient persistence. Stage 3 must therefore begin with a prerequisite data-foundation gate. Implementing analysis before that gate would either duplicate data contracts or force business logic into the frontend.

## Current architecture

### Runtime flow

```text
React components
    -> usePatients hook
        -> typed frontend API wrapper
            -> Tauri invoke
                -> patient commands
                    -> Mutex<PatientRepository>
                        -> SQLite in the Tauri application-data directory
```

The laboratory demonstration currently follows a separate path:

```text
src/data/demo.ts
    -> dashboard, comparison, profile, trend, source, and import components
```

This split is the main architectural boundary Stage 3 must remove for dashboard, comparison, and profile data. Static source-viewer, chart, and import behavior may remain until their assigned later stages, but they must not become an alternative implementation of business rules.

### Frontend

| Area | Current implementation | Status |
| --- | --- | --- |
| Application shell | `App.tsx`, `Shell.tsx`, and `Header.tsx` switch between dashboard and patient management | Implemented |
| Patient UI | `PatientManagement`, `PatientForm`, and `ConfirmDialog` provide CRUD, selection, validation, loading, empty, and error states | Implemented |
| Frontend boundary | `src/api/patients.ts` contains Tauri calls; `usePatients.ts` owns patient state and mutations | Implemented |
| Laboratory UI | Dashboard, patient workspace, profiles, trend, source preview, and import panel render `src/data/demo.ts` | Static only |
| Navigation | Dashboard and Patients are active; remaining destinations are visual Stage 1 controls | Partial |
| Frontend types | Patient command contracts coexist with display-only laboratory types | Partial |

Patient selection is UI session state. Patient records are persistent; the current selection is not persisted, which is not required by the frozen specification.

The static profile array is not an authoritative catalog: it covers only part of the initial set in `docs/04_LABORATORY_PROFILES.md` and includes `Vitamins & trace elements`, which is not listed there. Stage 3 must derive its versioned profile catalog only from authoritative definitions, not from the Stage 1 display fixture.

### Tauri command boundary

Four commands are registered:

- `list_patients`;
- `create_patient`;
- `update_patient`;
- `delete_patient`.

Commands delegate to the repository and return serialized patient objects. Errors currently cross the boundary as plain strings. No report, result, profile, analysis, import, or source commands exist.

### Rust domain and persistence

The Rust core currently contains three coherent modules:

- `domain.rs`: patient records, patient input, normalization, and validation;
- `persistence.rs`: SQLite initialization and patient CRUD;
- `commands.rs`: the Tauri adapter around the repository.

The database is stored as `labdelta.sqlite3` in Tauri's application-data directory. SQLite is bundled through `rusqlite`. The repository uses one connection protected by a `Mutex`.

Schema version 1 contains:

- `schema_migrations`;
- `patients`.

The migration is currently an inline `CREATE TABLE IF NOT EXISTS` batch. There is no ordered migration runner for later schema versions.

### Existing tests and validation gates

The current suite contains:

- Rust validation tests for patient name and date of birth;
- a Rust patient CRUD lifecycle test, including stable ID behavior;
- a Rust persistence test that closes and reopens a temporary SQLite database;
- React tests for the static shell, patient loading and selection, create/edit validation, and confirmed deletion;
- TypeScript, ESLint, Vitest, Vite build, Rust formatting, Cargo check, Cargo test, and strict Clippy commands in the project workflow.

There are no migration-upgrade tests, analysis golden tests, Tauri command contract tests against a real repository, full frontend-to-Rust integration tests, or packaged-application smoke tests.

### Fixtures

`fixtures/synthetic_source_schema.json` currently contains one fictional patient and an empty `reports` array. The reproducible reports, CSV, selectable-text PDF, and machine-readable expected analysis results required by `docs/09_TEST_DATA_SPECIFICATION.md` do not yet exist.

## Missing modules

### Required before or within Stage 3

| Module | Responsibility | Dependency |
| --- | --- | --- |
| Ordered migrations | Apply and verify schema versions after version 1 | Existing SQLite repository |
| Report domain | `LaboratoryReport`, report dates, laboratory, source metadata, identity status, and timestamps | Patient IDs |
| Result domain | Numeric/text values, source names, canonical IDs, units, supplied intervals or rules, provenance, review, and comparison eligibility | Report domain |
| Report/result persistence | Transactional storage and read queries with foreign keys | Ordered migrations |
| Profile domain | Stable profile IDs, names, descriptions, versions, provenance, and membership roles | Canonical parameter IDs |
| Profile persistence/catalog | Versioned initial definitions and many-to-many membership | Profile domain |
| Parameter identity | Canonical parameter IDs and explicit aliases needed by comparisons, including the specified ALT/ALAT/GPT case | Result domain |
| Unit compatibility | Explicit comparability decision without silent conversion | Result and parameter identity |
| Current classification | Below, within, above, unavailable, qualitative, or ambiguous from the supplied report interval/rule | Structured result |
| Reference position | Lower, middle, or upper third only for finite lower and upper bounds | Current classification |
| Previous comparison | Immediately preceding comparable result, delta, elapsed time, transition, interval-change warning, and notes | Parameter and unit comparability |
| Trend analysis | Short-term direction and long-term tendency from at least three comparable points | Previous comparison |
| Attention ordering | Explainable ordering based only on visible changes | Classification, comparison, and trends |
| Analysis read models | Stable DTOs for dashboard, patient comparison, and profile views | All analysis modules |
| Analysis Tauri commands | Thin adapters exposing read models to the frontend | Analysis read models |
| Frontend analysis API/hooks | Typed invocation, loading, empty, and error state | Analysis commands |
| Live dashboard/workspace/profile UI | Replace relevant static laboratory facts with Rust-produced read models | Frontend analysis API |
| Reproducible fixture set | Fictional structured reports and machine-readable expected outcomes | Finalized data contracts |

### Assigned to Stage 4, not Stage 3

- file selection and import orchestration;
- immutable raw-source storage and hashing;
- duplicate detection;
- JSON, CSV, and selectable-text PDF parsing into review data;
- scanned-PDF rejection;
- extracted patient identity and double identity check;
- mismatch and ambiguity blocking;
- unknown-parameter, unit-ambiguity, and value-review workflow;
- transactional import confirmation and rollback.

Stage 3 may create the reproducible file artifacts required by the earlier data-foundation stage, but it must not turn them into a functional end-user import workflow.

### Assigned to Stage 5, not Stage 3

- data-driven charts;
- functional original-source viewer;
- continuous integration;
- final documentation and contest package;
- cross-platform packaged final build and final smoke validation.

## Specification gaps that block deterministic implementation

The frozen documents define the required outcomes but do not yet define every deterministic rule. Stage 3 must not invent these values. The following points need authoritative completion before their affected module is implemented:

1. the numeric tolerance or rule that separates `stable` from `risen` and `fallen`;
2. the rule for when a percentage delta is meaningful, including a zero or near-zero previous value;
3. the exact explainable aggregation and tie-breaking rules for attention ordering;
4. the canonical parameter catalog beyond the explicit ALT/ALAT/GPT example;
5. the unit-compatibility table and whether any explicitly approved conversions exist;
6. the actual parameter memberships, roles, and display order for the initial laboratory profiles;
7. the behavior of patient deletion after reports reference a patient; silent cascading would conflict with traceability and must not be assumed;
8. deterministic ordering when reports have equal sample/report dates.

Effort estimates below assume these rules are supplied before the associated work starts. Waiting for specification completion is not included in the estimates.

## Recommended Stage 3 scope

Stage 3 should produce one authoritative Rust path from persisted structured results to dashboard, patient comparison, and profile read models.

Included:

- the missing report, result, and profile schema and migrations;
- reproducible synthetic report records and expected results;
- pure, versioned, deterministic classification, comparison, trend, profile, and attention logic;
- repository queries and read models;
- thin Tauri analysis commands;
- typed frontend adapters and integration into the existing dashboard, comparison table, and profile overview;
- required empty, insufficient-data, changed-interval, ambiguous, and error states for those views;
- tests at every layer.

Excluded:

- functional file import and patient identity resolution;
- source-file mutation or end-user source selection;
- chart implementation and source rendering;
- cloud, AI, telemetry, diagnosis, recommendation, prediction, or extrapolation;
- security or regulatory claims beyond the existing prototype boundaries.

## Recommended implementation order

### Gate 3.0 — Complete the data foundation

1. Convert the inline schema initialization into ordered migrations while preserving version 1 patient data.
2. Add report, result, profile, and profile-membership contracts with foreign keys and indexes required by defined queries.
3. Fix the unresolved deletion and equal-date ordering rules before encoding them in the schema.
4. Build the reproducible fictional fixture source and machine-readable expected outcomes.
5. Verify clean-database creation and migration from the existing version 1 database.

Exit criterion: structured reports and results can be stored, reopened, and queried without analysis logic or a functional import workflow.

### Step 3.1 — Define pure analysis contracts

Define explicit enums and version identifiers for classification, interval position, comparability, direction, tendency, profile role, and attention explanation. Keep these contracts independent of Tauri, SQLite, and React.

Exit criterion: every specified output state is representable without display strings acting as business logic.

### Step 3.2 — Implement classification and reference position

Implement supplied-interval/rule evaluation first. Cover finite ranges, one-sided rules, unavailable bounds, qualitative values, ambiguity, exact boundaries, and invalid structured input. Never synthesize an interval or flag.

Exit criterion: the current-result and interval-position fixture expectations pass.

### Step 3.3 — Implement comparability and previous comparison

Resolve parameter identity, unit compatibility, review status, comparison eligibility, and changed reference intervals before calculating deltas. Select only the immediately preceding comparable result using the authoritative date and tie-break rules.

Exit criterion: absolute delta, meaningful percentage delta, elapsed time, transition, warning, and comparison notes match the expected fixture.

### Step 3.4 — Implement short- and long-term tendencies

Derive the short-term state from the current and immediately preceding comparable value. Derive long-term tendency only with at least three comparable points. Return insufficient-data states explicitly and never predict or extrapolate.

Exit criterion: rising, falling, stable, variable, no-comparison, and insufficient-data cases pass deterministic tests.

### Step 3.5 — Implement profiles and attention ordering

Load versioned profile definitions, support overlapping memberships, retain membership roles and display order, and treat absent members only as not present. Build the transparent attention ordering strictly from visible analysis outputs.

Exit criterion: overlapping profile counts and ordering explanations match expected results without diagnostic language.

### Step 3.6 — Add read models and Tauri commands

Create query services for:

- global dashboard rows and expansion data;
- selected-patient comparison rows;
- patient profile summaries.

Tauri commands should only validate command inputs, call the query service, and serialize typed success or error results. Business calculations must not be repeated in commands or TypeScript.

Exit criterion: command-contract tests return stable camelCase DTOs and explicit error categories.

### Step 3.7 — Connect the existing UI

Add frontend API wrappers and hooks, then replace `src/data/demo.ts` as the source for dashboard, comparison, and profile facts. Preserve the Stage 1 layout. Implement only the states from `docs/13_UI_STATE_INVENTORY.md` that are supported by Stage 3 data.

Exit criterion: dashboard, patient comparison, and profile components render Rust-produced results and retain loading, empty, insufficient-data, and error behavior.

### Step 3.8 — Run the Stage 3 validation gate

Run all Rust and frontend unit/integration tests, formatting, type checking, linting, production frontend build, and Tauri build validation that is possible in the environment. Compare the complete synthetic fixture output to the machine-readable expected results.

Exit criterion: all required checks pass, or only clearly documented external tool/download failures remain.

## Dependencies

### Dependency chain

```text
authoritative calculation rules
    -> data contracts and migrations
        -> reproducible fixtures and expected results
            -> classification
                -> comparability and previous comparison
                    -> tendencies
                        -> profiles and attention ordering
                            -> read models and Tauri commands
                                -> React integration
```

Stage 4 depends on the report/result contracts, provenance fields, transactions, and error model established here. Stage 5 depends on Stage 3 read models and Stage 4 source/import records.

### Existing technical dependencies

- `rusqlite` with bundled SQLite for persistence;
- `serde` and `serde_json` for contracts and fixtures;
- `chrono` for dates and elapsed-time calculations;
- `uuid` for stable entity IDs;
- `thiserror` for Rust errors;
- Tauri 2 for the command boundary;
- React, TypeScript, and Vite for the UI;
- Vitest and Testing Library for frontend tests;
- `tempfile` for isolated SQLite tests.

The core Stage 3 analysis can be implemented with the existing dependency set. Any additional numeric representation, fixture-generation, or parsing dependency must be justified against determinism, cross-platform support, and the no-silent-conversion rule before adoption. PDF extraction and Tauri file-dialog dependencies belong to Stage 4; charting and source-rendering dependencies belong to Stage 5.

## Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Stage 2 foundation is incomplete relative to the master prompt | Analysis contracts could be built on temporary or duplicated models | Make Gate 3.0 mandatory and do not begin calculations before it passes |
| Calculation thresholds are unspecified | Implementations or tests would encode invented medical/product rules | Obtain authoritative rules before coding; represent unavailable outcomes explicitly |
| Static and persisted patients/laboratory facts coexist | The UI can display unrelated identities and results | Replace dashboard/comparison/profile static data through one vertical slice and keep patient context explicit |
| Inline migration approach does not scale | Existing local databases may diverge or lose data during schema growth | Add ordered, transactional migrations and test version 1 to the next version |
| Alias, unit, and interval differences affect comparability | Incorrect deltas or trends could be presented as valid | Make comparability a separate typed decision with explicit exclusion reasons |
| Floating-point and rounding rules are implicit | Cross-platform output or boundary behavior may differ | Define numeric storage, calculation precision, and display rounding before golden tests |
| Future foreign keys conflict with current patient deletion | Reports could be orphaned or deleted silently | Resolve deletion semantics before adding report foreign keys; never assume cascading deletion |
| Plain-string command errors do not encode UI states | Frontend behavior may depend on unstable message text | Introduce typed error categories at the read-model boundary while retaining human-readable messages |
| One mutex-protected SQLite connection handles all work | Long analysis or future imports can block UI commands | Keep Stage 3 queries bounded and transaction scopes short; reassess only with measured need |
| Profile definitions are incomplete | Profile outputs cannot be reproducible | Version the authoritative definitions and expected memberships before aggregation |
| Source provenance is deferred too far | Stage 4 could require destructive schema changes | Include all specified report/result provenance fields in Gate 3.0 without implementing source viewing |
| Test fixtures drift from expected results | A deterministic regression oracle becomes unreliable | Generate all fictional formats from one canonical fixture and version expected outputs |
| Unsafe wording enters display DTOs | The prototype could imply diagnosis or recommendation | Assert required factual wording and prohibited terms in contract/UI tests |
| Cross-platform file/PDF behavior is assumed during Stage 3 | Work expands into Stage 4 and creates platform-specific failures | Keep Stage 3 file-format artifacts separate from end-user parsing and source access |

## Estimated implementation effort

Estimates are focused engineering time for one developer already familiar with this repository. They include implementation, tests, review, and ordinary defect correction. They exclude specification waiting time, external dependency outages, clinical validation, regulatory work, and production security hardening.

One engineering day means approximately six to eight focused hours.

### Stage 3 work packages

| Work package | Estimate |
| --- | ---: |
| Gate 3.0: migrations, report/result/profile persistence, and migration tests | 2–3 days |
| Canonical fictional fixtures, three required file formats, and expected outputs | 2–3 days |
| Classification, comparability, comparison, and tendency engine | 3–5 days |
| Profiles, attention ordering, and read models | 1.5–2.5 days |
| Tauri commands and React integration | 1.5–2.5 days |
| Full regression, cross-layer tests, and Stage 3 validation | 1–1.5 days |
| **Total Stage 3 including the missing foundation** | **11–17.5 days** |

### Remaining master stages

| Master stage | Current status | Remaining estimate | Depends on |
| --- | --- | ---: | --- |
| Stage 1 — scaffold and static UI | Complete | 0 days | — |
| Stage 2 — SQLite model and reproducible demo | Patient CRUD complete; report/result/profile model and demo artifacts remain | 4–6 days, included in Gate 3.0 and fixture work above | Existing patient IDs and SQLite database |
| Stage 3 — deterministic engine and profiles | Not implemented | 7–11.5 days after the Stage 2 remainder | Authoritative rules and completed data foundation |
| Stage 4 — safe functional import | Not implemented | 8–12 days | Stage 3 contracts, provenance, transactions, and error model |
| Stage 5 — charts, source viewer, CI, documentation, contest package, final build | Static placeholders or not implemented | 7–11 days | Stage 3 analysis outputs and Stage 4 source records |

The Stage 2 remainder and Stage 3 estimates must not be added again to the combined Stage 3 total; the combined total already includes both.

## Test strategy

### 1. Pure Rust unit tests

Use table-driven tests for every deterministic rule:

- below, within, above, unavailable, qualitative, and ambiguous status;
- exact interval boundaries and lower/middle/upper thirds;
- one-sided and missing reference rules;
- immediate prior comparable selection;
- absolute and percentage delta, including zero-value handling;
- changed-interval warnings and status transitions;
- unit/parameter incompatibility and explicit comparison exclusion;
- risen, fallen, stable, no comparison, repeatedly rising, repeatedly falling, broadly stable, variable, and insufficient data;
- overlapping profile membership and absent members;
- deterministic attention ordering and tie-breaking.

Tests should call pure functions without SQLite, Tauri, clocks, locale, or UI dependencies. Time-dependent inputs must be passed explicitly.

### 2. Persistence and migration integration tests

Use temporary SQLite databases to verify:

- a clean database reaches the latest schema;
- an existing version 1 patient database migrates without patient loss or ID changes;
- report/result/profile foreign keys and uniqueness constraints;
- reopen persistence for all new entities;
- transactional rollback on partial failure;
- immutable raw-import metadata fields once Stage 4 begins;
- the resolved patient-deletion policy.

### 3. Canonical fixture and golden tests

Generate JSON, CSV, and selectable-text PDF artifacts from one fictional source fixture. Compare structured and analyzed output with machine-readable expected results covering the cases in `docs/09_TEST_DATA_SPECIFICATION.md`.

Stage 3 golden cases cover analysis, aliases, profile overlap, changed intervals, missing comparisons, and ambiguous units. Duplicate-file and identity-mismatch workflow assertions become Stage 4 tests.

### 4. Command contract tests

Verify command input validation, camelCase serialization, stable read-model fields, not-found behavior, and typed errors. Commands should be tested against a temporary real repository while the analysis engine remains separately unit tested.

### 5. Frontend tests

Mock only the typed API boundary and cover:

- loading, empty, populated, insufficient-data, and command-error states;
- patient selection changing the requested workspace data;
- dashboard expansion and deterministic order as delivered by the backend;
- changed-interval, unavailable, ambiguity, and no-comparison wording;
- overlapping profile display without implying required missing tests;
- preservation of the prototype and no-diagnosis notices.

### 6. End-to-end and packaged smoke tests

After the command/read-model vertical slice is stable, add a small Tauri smoke path using an isolated application-data directory: start with the reproducible fixture, open the dashboard, select a patient, and verify comparison/profile data. Full file-import and source-viewer paths remain Stage 4 and Stage 5 tests.

### 7. Required regression gate for every implementation stage

- `cargo fmt --check`;
- `cargo check`;
- `cargo test`;
- `cargo clippy --all-targets -- -D warnings`;
- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run build`;
- relevant Tauri development or production build validation;
- `git diff --check` before the stage commit.

## Stage 3 completion criteria

Stage 3 is complete only when:

1. version 1 databases migrate without losing patient data or changing patient IDs;
2. reports, results, profiles, and memberships persist and reopen correctly;
3. all calculations are deterministic, versioned, and implemented once in Rust;
4. all specified analysis states are represented explicitly;
5. dashboard, patient comparison, and profile views consume Rust read models instead of static laboratory facts;
6. every displayed calculated result retains report/result provenance;
7. the reproducible fixture and expected results cover the required Stage 3 cases;
8. no functional import, chart, source-viewer, cloud, AI, diagnostic, or recommendation scope has been added;
9. all Stage 3 validation gates pass or any exclusively external validation block is precisely documented;
10. the working partial product remains usable before Stage 4 begins.
