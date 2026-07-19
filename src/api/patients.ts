import { invoke } from "@tauri-apps/api/core";
import type { ConfirmedReportValue, LaboratoryReport, PatientDetails, PatientListItem } from "../types";

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
