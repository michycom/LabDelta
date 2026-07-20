import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ConfirmedReportValue, LaboratoryReport, PatientDetails } from "../types";
import { buildSyntheticDocumentPages } from "../data/syntheticDocument";
import { SyntheticDocumentView } from "./SyntheticDocumentView";

const patient: PatientDetails = { id: "patient", displayName: "Dirk Mayer", dateOfBirth: "1978-09-04", isArchived: false, sexReferenceContext: "male", externalIdentifier: "DEMO-DIRK", createdAt: "2026-01-01", updatedAt: "2026-01-01", archivedAt: null, bodyMeasurements: [], profiles: [] };
const report: LaboratoryReport = { id: "abcdef12-3456", patientId: "patient", laboratoryName: "Synthetic Laboratory", specimenCollectedAt: "2026-01-02", laboratoryReceivedAt: null, reportReleasedAt: "2026-01-03", revisionNumber: "1", importedAt: "2026-01-03" };
const values: ConfirmedReportValue[] = Array.from({ length: 8 }, (_, index) => ({ id: `working-${index}`, reportId: report.id, extractionVersionId: "extract", versionNumber: 1, parameterName: `Parameter ${index}`, confirmedValue: { kind: "numericText", value: String(index) }, unit: "unit", suppliedReferenceRange: "1-9", confirmationStatus: "explicit", original: { id: `original-${index}`, parameterName: `Original ${index}`, valueText: String(index), unit: "unit", suppliedReferenceRange: "1-9", document: { id: "document", originalFileName: "dirk-synthetic.json", checksumAlgorithm: "SHA-256", contentChecksum: "a".repeat(64) } }, provenance: { id: `location-${index}`, locator: { kind: "jsonPath", path: `$.values[${index}]` }, textExcerpt: null } }));

afterEach(cleanup);

describe("synthetic document view", () => {
  it("generates stable pages exclusively from report, patient, value, and provenance data", () => {
    const pages = buildSyntheticDocumentPages(patient, report, values);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({ patientName: "Dirk Mayer", laboratoryName: "Synthetic Laboratory", reportId: report.id, pageNumber: 1, pageCount: 2 });
    expect(pages[0]?.rows[0]).toMatchObject({ workingValueId: "working-0", parameterName: "Original 0", provenance: "JSON path: $.values[0]", sourceDocument: "dirk-synthetic.json" });
  });

  it("navigates multiple generated pages without changing provenance", () => {
    render(<SyntheticDocumentView patient={patient} report={report} values={values} />);
    expect(screen.getByText("Original 0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Page" }));
    expect(screen.getByText("Original 7")).toBeInTheDocument();
    expect(screen.getByText(/Original 7 · JSON path: \$\.values\[7\]/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous Page" }));
    expect(screen.getByText("Original 0")).toBeInTheDocument();
  });
});
