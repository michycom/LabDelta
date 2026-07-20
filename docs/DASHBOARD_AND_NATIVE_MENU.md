# Contest Dashboard and Native Menu

Status: **implemented read-only contest surface**

The post-disclaimer start view reads only the approved SQLite seed graph. It
shows Eva Mittel, Dirk Mayer, and Daniel Power; no dashboard patient, value,
interval, profile, or source detail is statically invented in React.

## Deterministic dashboard behavior

The Rust core classifies the latest explicitly confirmed value as `below`,
`within`, `above`, or `not assessable` against the interval supplied by that
same synthetic report. Rule `report-reference-interval@1` supports only the
stored interval forms used by the approved fixtures. Missing or unsupported
data is not assessable; there is no fallback rule or conversion.

Longitudinal comparison uses only the same canonical parameter and exact unit
from the immediately preceding synthetic report. Rule
`exact-parameter-unit-previous-report@1` returns current and previous value,
absolute difference, relative difference when the previous value is non-zero,
and `higher`, `lower`, `equal`, or `no comparison`.

Filters are `All`, `Outside reference`, `Changed`, and `Longitudinal data`.
Sorting places patients with outside-report values first, then orders by outside
count descending, latest report date descending, name, and stable ID. This is
transparent arithmetic and contains no diagnosis, score, recommendation, risk,
or medical prioritization.

Profiles are read from existing versioned static assignments. Each profile
shows assigned, present, and outside-reference parameter counts. Profiles remain
organizational groupings only. Report Reference remains the default; Demo
Reference Catalog v1 remains optional and is never applied automatically.

## Native menu

- **LabDelta:** About, Show Demo Disclaimer, and Quit are active; Settings is
  disabled.
- **File:** Close Patient and Import Demo Fixture are active navigation actions;
  Print is disabled. Import opens only the local limitation view.
- **Patient / Report / View:** local selection, report navigation, provenance,
  dashboard/sidebar navigation, and full screen are active. Show Original Source
  is disabled because there is no separate meaningful source-view surface.
- **Demo:** Play, Pause, Stop, Restart, both language choices, and Reset Demo
  Data are visible but disabled. No demo state machine exists in this sprint.
- **Help:** all entries open local informational views without network access.

No file dialog, drag-and-drop target, import operation, parser, or write command
is registered for the dashboard or native menu.
