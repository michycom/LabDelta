import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as patientApi from "./api/patients";
import App from "./App";
import { DEMO_ACKNOWLEDGEMENT_KEY } from "./state/demoAcknowledgement";
import type { ConfirmedReportValue, LaboratoryReport, PatientDetails, PatientListItem, ReferenceCatalogParameter, ReferenceSource } from "./types";

vi.mock("./api/patients", () => ({
  listPatients: vi.fn(),
  getPatientDetails: vi.fn(),
  listLaboratoryReports: vi.fn(),
  listConfirmedReportValues: vi.fn(),
  listReferenceSources: vi.fn(),
  listReferenceCatalogParameters: vi.fn()
}));

const patient: PatientListItem = {
  id: "8bd067aa-f087-8f27-88a7-0a9cf16fb054",
  displayName: "Eva Mittel",
  dateOfBirth: "2001-03-12",
  isArchived: false
};

const details: PatientDetails = {
  ...patient,
  sexReferenceContext: "female",
  externalIdentifier: "DEMO-EVA",
  createdAt: "2025-01-11T10:00:00Z",
  updatedAt: "2025-01-11T10:00:00Z",
  archivedAt: null,
  bodyMeasurements: [
    { kind: "height", measuredAt: "2026-01-15T08:00:00Z", originalValueText: "160", originalUnit: "cm", verificationStatus: "explicit" },
    { kind: "weight", measuredAt: "2026-01-15T08:00:00Z", originalValueText: "45", originalUnit: "kg", verificationStatus: "explicit" }
  ],
  profiles: [
    { id: "small-blood-count", version: 1, name: "Small Blood Count", description: "Static grouping", parameterNames: ["Leukocytes", "Erythrocytes", "Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC", "Platelets"] },
    { id: "general-health", version: 1, name: "General Health", description: "Static grouping", parameterNames: ["Leukocytes", "Hemoglobin", "Creatinine", "CRP"] }
  ]
};

const report: LaboratoryReport = {
  id: "18f3c5f0-6ce8-8d2d-99c6-ad7f43af18ec",
  patientId: patient.id,
  laboratoryName: "LabDelta Synthetic Laboratory North",
  specimenCollectedAt: "2025-01-10T08:15:00Z",
  laboratoryReceivedAt: "2025-01-10T09:05:00Z",
  reportReleasedAt: "2025-01-10T12:30:00Z",
  revisionNumber: "1",
  importedAt: "2025-01-11T10:00:00Z"
};

const confirmedValue: ConfirmedReportValue = {
  id: "working-value-1",
  reportId: report.id,
  extractionVersionId: "extraction-version-1",
  versionNumber: 1,
  parameterName: "Leukocytes",
  confirmedValue: { kind: "numericText", value: "6.2" },
  unit: "G/L",
  suppliedReferenceRange: "4.0-10.0",
  confirmationStatus: "explicit",
  original: {
    id: "original-value-1",
    parameterName: "Leukocytes",
    valueText: "6.2",
    unit: "G/L",
    suppliedReferenceRange: "4.0-10.0",
    document: {
      id: "document-1",
      originalFileName: "eva-mittel.json",
      checksumAlgorithm: "SHA-256",
      contentChecksum: "a".repeat(64)
    }
  },
  provenance: {
    id: "location-1",
    locator: { kind: "jsonPath", path: "$.reports[0].values[0]" },
    textExcerpt: "Leukocytes: 6.2 G/L; supplied synthetic report reference 4.0-10.0"
  }
};

const referenceSources: ReferenceSource[] = [
  { id: "report-reference", version: 1, kind: "report", displayName: "Report Reference", description: "Original report", availability: "active", isDefault: true, demonstrationOnly: false, sourceNotice: "Default source. Original report reference information remains authoritative for the demonstration." },
  { id: "demo-reference-catalog", version: 1, kind: "demoCatalog", displayName: "Demo Reference Catalog v1", description: "Synthetic demo", availability: "active", isDefault: false, demonstrationOnly: true, sourceNotice: "Demonstration catalog only." },
  { id: "ifcc-reference", version: 1, kind: "ifcc", displayName: "IFCC", description: "Future", availability: "futureDisabled", isDefault: false, demonstrationOnly: false, sourceNotice: "Future catalog placeholder." },
  { id: "dgkl-reference", version: 1, kind: "dgkl", displayName: "DGKL", description: "Future", availability: "futureDisabled", isDefault: false, demonstrationOnly: false, sourceNotice: "Future catalog placeholder." },
  { id: "local-laboratory-reference", version: 1, kind: "localLaboratory", displayName: "Local Laboratory", description: "Future", availability: "futureDisabled", isDefault: false, demonstrationOnly: false, sourceNotice: "Future catalog placeholder." }
];

const demoCatalogParameters: ReferenceCatalogParameter[] = Array.from({ length: 9 }, (_, index) => ({
  catalogId: "demo-reference-catalog", catalogVersion: 1, parameterId: `synthetic-parameter-${index + 1}`,
  displayName: ["Leukocytes", "Erythrocytes", "Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC", "Platelets", "CRP"][index] ?? "CRP", originalUnit: "synthetic-unit",
  lowerBoundText: "1", upperBoundText: "2", referenceRuleText: null,
  contextNotice: "Synthetic demonstration interval; no medical meaning.", displayOrder: index + 1
}));

afterEach(cleanup);

beforeEach(() => {
  window.localStorage.setItem(DEMO_ACKNOWLEDGEMENT_KEY, "true");
  vi.clearAllMocks();
  vi.mocked(patientApi.listPatients).mockResolvedValue([patient]);
  vi.mocked(patientApi.getPatientDetails).mockResolvedValue(details);
  vi.mocked(patientApi.listLaboratoryReports).mockResolvedValue([report]);
  vi.mocked(patientApi.listConfirmedReportValues).mockResolvedValue([confirmedValue]);
  vi.mocked(patientApi.listReferenceSources).mockResolvedValue(referenceSources);
  vi.mocked(patientApi.listReferenceCatalogParameters).mockResolvedValue(demoCatalogParameters);
});

describe("persisted synthetic demo flow", () => {
  it("renders patient, report, confirmed value, original source, and provenance", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Eva Mittel" })).toBeInTheDocument();
    expect(screen.getAllByText("2025-01-10T08:15:00Z").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LabDelta Synthetic Laboratory North").length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Leukocytes")).length).toBeGreaterThan(0);
    expect(screen.getByText("6.2")).toBeInTheDocument();
    expect(screen.getByText("G/L")).toBeInTheDocument();
    expect(screen.getByText("4.0-10.0")).toBeInTheDocument();
    expect(screen.getByText("JSON path: $.reports[0].values[0]")).toBeInTheDocument();
    expect(screen.getByText("Source: eva-mittel.json")).toBeInTheDocument();
    expect(screen.getByText(/height: 160 cm \(explicit\)/)).toBeInTheDocument();
    expect(screen.getByText(/Small Blood Count/)).toBeInTheDocument();
    expect(screen.getByText(/General Health/)).toBeInTheDocument();
    expect(patientApi.getPatientDetails).toHaveBeenCalledWith(patient.id);
    expect(patientApi.listLaboratoryReports).toHaveBeenCalledWith(patient.id);
    expect(patientApi.listConfirmedReportValues).toHaveBeenCalledWith(report.id);
  });

  it("keeps report reference default and exposes only the demo catalog as another active choice", async () => {
    render(<App />);

    const selector = await screen.findByLabelText("Reference source");
    expect(selector).toHaveValue("report-reference");
    expect(screen.getByRole("option", { name: "IFCC (future - disabled)" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "DGKL (future - disabled)" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Local Laboratory (future - disabled)" })).toBeDisabled();
    fireEvent.change(selector, { target: { value: "demo-reference-catalog" } });
    expect(await screen.findByText(/9 synthetic parameters available; not applied automatically/)).toBeInTheDocument();
    expect(patientApi.listReferenceCatalogParameters).toHaveBeenCalledWith("demo-reference-catalog", 1);
  });

  it("shows the patient loading state explicitly", () => {
    vi.mocked(patientApi.listPatients).mockReturnValue(new Promise(() => undefined));

    render(<App />);

    expect(screen.getByText("Loading approved demo patients from local SQLite…")).toBeInTheDocument();
  });

  it("shows an explicit empty patient state", async () => {
    vi.mocked(patientApi.listPatients).mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByText("No approved demo patients are stored.")).toBeInTheDocument();
  });

  it("shows a structured patient loading failure and supports retry", async () => {
    vi.mocked(patientApi.listPatients).mockRejectedValue({ code: "persistence", message: "SQLite read failed" });

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("SQLite read failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(patientApi.listPatients).toHaveBeenCalledTimes(2));
  });

  it("shows an explicit empty report state", async () => {
    vi.mocked(patientApi.listLaboratoryReports).mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByText("No laboratory reports are stored for this patient.")).toBeInTheDocument();
    expect(patientApi.listConfirmedReportValues).not.toHaveBeenCalled();
  });

  it("shows explicit empty and error states for confirmed values", async () => {
    vi.mocked(patientApi.listConfirmedReportValues).mockResolvedValue([]);
    const firstRender = render(<App />);
    expect(await screen.findByText("No explicitly confirmed working values are stored for this report.")).toBeInTheDocument();

    firstRender.unmount();
    vi.mocked(patientApi.listConfirmedReportValues).mockRejectedValue({ code: "persistence", message: "Value read failed" });
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Value read failed");
  });
});
