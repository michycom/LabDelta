import { invoke } from "@tauri-apps/api/core";
import type { Patient, PatientInput } from "../types";

export function listPatients(): Promise<Patient[]> {
  return invoke<Patient[]>("list_patients");
}

export function createPatient(input: PatientInput): Promise<Patient> {
  return invoke<Patient>("create_patient", { input });
}

export function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  return invoke<Patient>("update_patient", { id, input });
}

export function deletePatient(id: string): Promise<void> {
  return invoke<void>("delete_patient", { id });
}
