# LabDelta

**Medicine already has the data. LabDelta helps clinicians see it.**

Privacy-first, local desktop software for medical professionals, intended to be released as open source. LabDelta compares longitudinal laboratory reports, highlights changes, groups affected values into overlapping functional laboratory profiles, and preserves source traceability.

It does not diagnose disease, estimate disease probability, recommend treatment, or recommend additional tests.

Status: Gate 3.0 contest foundation implemented. The desktop demo loads only
checksum-approved synthetic fixtures into local SQLite and exposes confirmed
values with their original source text and location. It performs only
deterministic report-interval classification and exact longitudinal arithmetic;
it deliberately performs no medical interpretation, charting, source import,
or runtime AI.

## Contest demo

```bash
npm install
npm run tauri dev
```

On first launch, acknowledge the synthetic-data notice. The SQLite-driven
dashboard then shows exactly the deterministic synthetic patients Eva Mittel,
Dirk Mayer, and Daniel Power. Patient cards expose report and reference-status
counts, exact longitudinal differences, transparent static profile assignments,
and compact provenance details. Dashboard filters and sorting are deterministic
and non-diagnostic. The existing report view remains available from each card
and from the sidebar.

Manual import is disabled; its view explains that the Contest Demo uses only
approved synthetic fixtures. The native desktop menu provides local navigation,
information actions, and controls for a ten-step self-running walkthrough. The
same Play, Pause, Stop, Restart, English, and Deutsch controls remain visible in
the application. The walkthrough drives real views, highlights their real data,
shows animated subtitles, and optionally speaks them through the operating
system's Web Speech synthesis. It does not create a simulated UI or video.

Report Reference remains the default; the optional Demo Reference Catalog v1
is synthetic and is never applied automatically. `scripts/generate_demo_artifacts.py`
recreates the canonical CSV and selectable-text PDF from the approved JSON
fixtures; their hashes are recorded in
`fixtures/demo_seed/v1/derived-artifacts.json`.

See `docs/DEMO_WALKTHROUGH.md` for the self-running demonstration,
`docs/DASHBOARD_AND_NATIVE_MENU.md` for the visible workflow, and
`docs/GATE_3_0_ACCEPTANCE.md` for the implemented scope and validation commands.

License model to be determined before the first public release.
