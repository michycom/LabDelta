import type { LabResult, LaboratoryProfile, PatientSummary } from "../types";

// Legacy Stage-1 display contracts. The active contest UI reads Rust/SQLite.
// These values mirror only the three approved synthetic identities and contain
// no medical classification or interpretation.
export const patients: PatientSummary[] = [
  { id: "DEMO-EVA", name: "Eva Mittel", birthDate: "2001-03-12", latestReport: "2026-06-15", flagged: "Not assessed", profiles: ["Small Blood Count", "General Health"], severity: "normal", changes: [] },
  { id: "DEMO-DIRK", name: "Dirk Mayer", birthDate: "1978-09-04", latestReport: "2026-06-20", flagged: "Not assessed", profiles: ["Small Blood Count", "Glucose Metabolism", "Lipid Profile", "Kidney Profile"], severity: "normal", changes: [] },
  { id: "DEMO-DANIEL", name: "Daniel Power", birthDate: "1989-12-18", latestReport: "2026-06-12", flagged: "Not assessed", profiles: ["Small Blood Count", "Liver Profile", "Inflammation", "General Health"], severity: "normal", changes: [] }
];

export const results: LabResult[] = [];

export const profiles: LaboratoryProfile[] = [
  "Small Blood Count", "General Health", "Glucose Metabolism", "Lipid Profile",
  "Kidney Profile", "Liver Profile", "Inflammation"
].map(name => ({ name, affected: "Static assignment", status: "No interpretation", severity: "normal" }));
