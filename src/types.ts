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

