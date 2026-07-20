# Gate 3.0 Contest Acceptance

Status: **implemented for the read-only contest demonstration**

This note records the smallest working Gate 3.0 slice used by the contest
demo. `PROJECT_FOUNDATION.md` remains authoritative. No analysis, medical
interpretation, diagnostic prioritization, import workflow, chart, source
viewer, or real-data path was added. The dashboard performs only documented
reference-interval classification and exact arithmetic comparison.

## Gate 3.0A - persistence foundation

- Ordered, transactional migrations create schema version 5 and preserve a
  version-1 patient's stable ID.
- Reports, immutable document metadata, provenance locations, original values,
  extraction versions, explicitly confirmed working values, append-only
  corrections, and optional provenance-bearing height/weight records are
  represented with foreign keys.
- Report chronology stores all six foundation ordering fields. The read model
  uses their deterministic order without describing it as medical chronology.
- Archive state, cascade deletion, immutable originals, correction history,
  reopen behavior, rollback-safe migrations, and foreign-key integrity are
  covered by Rust persistence tests.
- The contest UI is intentionally read-only. It displays archive status but
  does not expose archive or permanent-delete actions, avoiding destructive
  mutation of the approved seed during a demonstration.

## Gate 3.0B - demo foundation

- Three embedded JSON fixture-v2 files for Eva Mittel, Dirk Mayer, and Daniel
  Power are approved by fixture ID, version, demo
  marker, and SHA-256. Unknown or changed content fails closed.
- Seed version `contest-demo-v1` produces deterministic IDs and an idempotent,
  verified local SQLite graph. Only explicitly confirmed working values are
  returned by the read path.
- Canonical CSV and selectable-text PDF artifacts are generated from those
  JSON fixtures by `scripts/generate_demo_artifacts.py`; their hashes and source
  list are recorded in `fixtures/demo_seed/v1/derived-artifacts.json` and are
  validated before the seed runs.
- The first-launch disclaimer and persistent synthetic-demo marker are covered
  by frontend tests.
- The post-disclaimer start view is an SQLite-driven dashboard containing
  exactly the three approved patients. Four deterministic filters, transparent
  non-diagnostic sorting, versioned profile counts, and compact provenance
  details are calculated in Rust and rendered as typed results in React.
- A native Tauri menu exposes local navigation and information views. Import is
  information-only. Play, Pause, Stop, Restart, English, and Deutsch control a
  ten-step walkthrough of the real application; Reset Demo Data remains
  disabled.
- The walkthrough uses centralized bilingual step definitions, animated
  subtitles, local Web Speech synthesis when available, and resilient
  highlighting of real asynchronously loaded UI elements. It contains no video,
  duplicate interface, import operation, medical rule, cloud, or runtime AI.
- Public-demo polish adds locally remembered collapsible panels, an animated
  15-second introduction, bounded Previous/Next demo actions, stable highlight
  anchors, and multi-page synthetic HTML documents generated solely from the
  existing read model. No migration or medical logic was added.
- Seed, future controlled fixture import, and any future real-data path remain
  separate. Gate 3.0 implements only the seed.

## Gate 3.0C - catalog foundation

- Schema version 4 added versioned parameter, original-name/alias, external
  code, unit, conversion-rule metadata, profile, membership, and general rule
  structures.
- Analysis contracts can reference explicit non-confirmed, non-assessable, and
  non-comparable states plus input and rule versions without performing
  analysis.
- All medically curated catalog tables are empty by default. No placeholder
  parameter mapping, profile membership, conversion factor, threshold, or
  medical rule is seeded.
- The reference-source extension is documented in `REFERENCE_CATALOGS.md`.
  Report Reference remains the default; the separate nine-parameter Demo
  Reference Catalog v1 is explicitly synthetic and demonstration-only. IFCC,
  DGKL, and Local Laboratory are visible future-disabled source records without
  catalog content.

## Reproducible validation

Run from the repository root:

```bash
cd src-tauri
cargo fmt --check
cargo check
cargo test
cargo clippy --all-targets -- -D warnings
cd ..
npm run typecheck
npm run lint
npm test
npm run build
npm run tauri build -- --bundles app
git diff --check
```

The PDF is additionally checked by extracting its selectable text and by
rendering every page to PNG for visual inspection.

Validated on 2026-07-20: all commands above pass (35 Rust tests and 23 frontend
tests), and the macOS `LabDelta.app` bundle is produced.
