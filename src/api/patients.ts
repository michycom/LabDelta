import { invoke } from "@tauri-apps/api/core";
import type { ConfirmedReportValue, DashboardFilter, DashboardView, LaboratoryReport, PatientDetails, PatientListItem, ReferenceCatalogParameter, ReferenceSource } from "../types";

export function getDashboard(filter: DashboardFilter): Promise<DashboardView> {
  return invoke<DashboardView>("get_dashboard", { filter });
}

export function listPatients(): Promise<PatientListItem[]> {
  return invoke<PatientListItem[]>("list_patients");
}

export function getPatientDetails(patientId: string): Promise<PatientDetails> {
  return invoke<PatientDetails>("get_patient_details", { patientId });
}

export function listLaboratoryReports(patientId: string): Promise<LaboratoryReport[]> {
  return invoke<LaboratoryReport[]>("list_laboratory_reports", { patientId });
}

export function listConfirmedReportValues(reportId: string): Promise<ConfirmedReportValue[]> {
  return invoke<ConfirmedReportValue[]>("list_confirmed_report_values", { reportId });
}

export function listReferenceSources(): Promise<ReferenceSource[]> {
  return invoke<ReferenceSource[]>("list_reference_sources");
}

export function listReferenceCatalogParameters(referenceSourceId: string, referenceSourceVersion: number): Promise<ReferenceCatalogParameter[]> {
  return invoke<ReferenceCatalogParameter[]>("list_reference_catalog_parameters", { referenceSourceId, referenceSourceVersion });
}
