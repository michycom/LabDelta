import type { ConfirmedReportValue, LaboratoryReport, PatientDetails, ProvenanceLocator } from "../types";

const rowsPerPage = 7;

export function parameterAnchorKey(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface SyntheticDocumentRow {
  workingValueId: string;
  parameterName: string;
  result: string;
  unit: string;
  reference: string;
  provenance: string;
  sourceDocument: string;
}

export interface SyntheticDocumentPage {
  reportId: string;
  pageNumber: number;
  pageCount: number;
  laboratoryName: string;
  reportDate: string;
  patientName: string;
  dateOfBirth: string;
  sourceDocument: string;
  rows: SyntheticDocumentRow[];
}

function provenanceLabel(locator: ProvenanceLocator): string {
  switch (locator.kind) {
    case "jsonPath": return `JSON path: ${locator.path}`;
    case "page": return `Page: ${locator.pageNumber}`;
    case "tableCell": return `Row ${locator.rowNumber}, column ${locator.columnName}`;
    case "textSpan": return `Text offset ${locator.startOffset}–${locator.endOffset}`;
    case "document": return "Document-level source";
  }
}

export function buildSyntheticDocumentPages(patient: PatientDetails, report: LaboratoryReport, values: ConfirmedReportValue[]): SyntheticDocumentPage[] {
  const rows = values.map(value => ({
    workingValueId: value.id,
    parameterName: value.original.parameterName,
    result: value.original.valueText,
    unit: value.original.unit ?? "Not supplied",
    reference: value.original.suppliedReferenceRange ?? "Not supplied",
    provenance: provenanceLabel(value.provenance.locator),
    sourceDocument: value.original.document.originalFileName
  }));
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  return Array.from({ length: pageCount }, (_, index) => ({
    reportId: report.id,
    pageNumber: index + 1,
    pageCount,
    laboratoryName: report.laboratoryName ?? "Laboratory not supplied",
    reportDate: report.reportReleasedAt ?? report.specimenCollectedAt ?? "Date not supplied",
    patientName: patient.displayName,
    dateOfBirth: patient.dateOfBirth,
    sourceDocument: rows[0]?.sourceDocument ?? "Source document not supplied",
    rows: rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage)
  }));
}
