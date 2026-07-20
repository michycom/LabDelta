# LabDelta

**Medicine already has the data. LabDelta helps clinicians see it.**

Privacy-first, local desktop software for medical professionals, intended to be released as open source. LabDelta compares longitudinal laboratory reports, highlights changes, groups affected values into overlapping functional laboratory profiles, and preserves source traceability.

It does not diagnose disease, estimate disease probability, recommend treatment, or recommend additional tests.

Status: Gate 3.0 contest foundation implemented. The desktop demo loads only
checksum-approved synthetic fixtures into local SQLite and exposes confirmed
values with their original source text and location. It deliberately performs
no medical analysis, prioritization, charting, source import, or runtime AI.

## Contest demo

```bash
npm install
npm run tauri dev
```

On first launch, acknowledge the synthetic-data notice. The dashboard then
shows three deterministic demo patients, their reports, explicitly confirmed
working values, source provenance, and a visible reference-source selector.
Report Reference remains the default; the optional Demo Reference Catalog v1
is synthetic and is never applied automatically. `scripts/generate_demo_artifacts.py`
recreates the canonical CSV and selectable-text PDF from the approved JSON
fixtures; their hashes are recorded in
`fixtures/demo_seed/v1/derived-artifacts.json`.

See `docs/GATE_3_0_ACCEPTANCE.md` for the implemented scope and validation
commands.

License model to be determined before the first public release.
