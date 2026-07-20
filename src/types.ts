export type Severity = "normal" | "slight" | "attention" | "marked";
export type Direction = "risen" | "fallen" | "stable";

export interface PatientSummary {
  id: string;
  name: string;
  birthDate: string;
  latestReport: string;
  flagged: string;
  profiles: string[];
  changes: ChangeSummary[];
  severity: Severity;
}

export interface ChangeSummary {
  parameter: string;
  delta: string;
  direction: Direction;
}

export interface LabResult extends ChangeSummary {
  previous: string;
  current: string;
  reference: string;
  position: string;
  tendency: string;
  history: string;
  severity: Severity;
}

export interface LaboratoryProfile {
  name: string;
  affected: string;
  status: string;
  severity: Severity;
}

export interface Patient {
  id: string;
  displayName: string;
  dateOfBirth: string;
  sexReferenceContext: string | null;
  externalIdentifier: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInput {
  displayName: string;
  dateOfBirth: string;
  sexReferenceContext: string | null;
  externalIdentifier: string | null;
}

export interface PatientListItem {
  id: string;
  displayName: string;
  dateOfBirth: string;
  isArchived: boolean;
}

export interface PatientDetails extends PatientListItem {
  sexReferenceContext: string | null;
  externalIdentifier: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  bodyMeasurements: Array<{
    kind: string;
    measuredAt: string;
    originalValueText: string;
    originalUnit: string;
    verificationStatus: "explicit";
  }>;
  profiles: Array<{
    id: string;
    version: number;
    name: string;
    description: string;
    parameterNames: string[];
  }>;
}

export interface LaboratoryReport {
  id: string;
  patientId: string;
  laboratoryName: string | null;
  specimenCollectedAt: string | null;
  laboratoryReceivedAt: string | null;
  reportReleasedAt: string | null;
  revisionNumber: string | null;
  importedAt: string;
}

export type PersistedValue =
  | { kind: "numericText"; value: string }
  | { kind: "text"; value: string };

export type ProvenanceLocator =
  | { kind: "jsonPath"; path: string }
  | { kind: "page"; pageNumber: number }
  | { kind: "tableCell"; rowNumber: number; columnName: string }
  | { kind: "textSpan"; startOffset: number; endOffset: number }
  | { kind: "document" };

export interface ConfirmedReportValue {
  id: string;
  reportId: string;
  extractionVersionId: string;
  versionNumber: number;
  parameterName: string;
  confirmedValue: PersistedValue;
  unit: string | null;
  suppliedReferenceRange: string | null;
  confirmationStatus: "explicit";
  original: {
    id: string;
    parameterName: string;
    valueText: string;
    unit: string | null;
    suppliedReferenceRange: string | null;
    document: {
      id: string;
      originalFileName: string;
      checksumAlgorithm: string;
      contentChecksum: string;
    };
  };
  provenance: {
    id: string;
    locator: ProvenanceLocator;
    textExcerpt: string | null;
  };
}

export interface ReferenceSource {
  id: string;
  version: number;
  kind: "report" | "demoCatalog" | "ifcc" | "dgkl" | "localLaboratory";
  displayName: string;
  description: string;
  availability: "active" | "futureDisabled";
  isDefault: boolean;
  demonstrationOnly: boolean;
  sourceNotice: string;
}

export interface ReferenceCatalogParameter {
  catalogId: string;
  catalogVersion: number;
  parameterId: string;
  displayName: string;
  originalUnit: string;
  lowerBoundText: string | null;
  upperBoundText: string | null;
  referenceRuleText: string | null;
  contextNotice: string;
  displayOrder: number;
}

export interface CommandFailure {
  code: "invalidInput" | "notFound" | "invalidStoredData" | "persistence" | "persistenceUnavailable";
  message: string;
}

export type AppSection = "dashboard" | "patients";
