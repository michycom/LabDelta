# Public Demo UI Surface

Status: **contest UI polish implemented**

The existing dashboard mockup is used only as a visual reference for spacing,
panel proportions, typography, lines, icons, shadows, and hierarchy. No mockup
patient, value, classification, chart, or rule is present in the running UI.

## Panel system

The reusable panel header provides accessible Collapse/Expand controls. State is
stored locally per panel and restored on the next render. Content stays mounted
while hidden, preventing data reloads and preserving the selected report and
document page. Dashboard, patient detail, profile assignments, parameter/report
history, comparison values, original document, and import information use this
system. Panel reordering is deliberately omitted.

## Import boundary

The polished Import panel contains a disabled dropzone, documented fixture
artifact formats, existing seed safety information, and the currently selected
synthetic patient. There is no file input, file dialog, drop handler, parser,
write command, or import operation.

## Highlight preparation

Stable `data-demo-target` attributes identify the major public-demo surfaces.
Stable `data-parameter-key` and `data-working-value-id` attributes connect the
same seeded parameter between prepared history anchors, comparison rows, and
generated document rows. This run does not add coordinated animation.
