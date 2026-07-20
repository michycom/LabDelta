# Synthetic Document View

Status: **generated read-only demonstration pages**

The document view is not a PDF renderer and contains no real document. It
generates report-like HTML pages at runtime from the selected SQLite-backed
synthetic patient, laboratory report, explicitly confirmed original values,
units, supplied references, source filename, and provenance locators.

Each page displays the stored laboratory name, report date, patient name, date
of birth, stable report ID, parameter rows, page count, source filename, a
decorative barcode derived from the stable report ID, and a clearly synthetic
signature field. Seven stored rows are placed on each page, producing stable
multi-page documents for larger approved reports.

Page thumbnails and Previous Page / Next Page change only local display state.
Every row keeps its confirmed working-value ID and normalized parameter anchor,
while the provenance panel displays the stored locator. No document content is
persisted, parsed, imported, inferred, or medically interpreted.
