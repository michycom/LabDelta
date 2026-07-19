import { useCallback, useEffect, useMemo, useState } from "react";
import * as patientApi from "../api/patients";
import type { Patient, PatientInput } from "../types";

function sortPatients(patients: Patient[]): Patient[] {
  return [...patients].sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedPatients = sortPatients(await patientApi.listPatients());
      setPatients(loadedPatients);
      setSelectedPatientId(current => current && loadedPatients.some(patient => patient.id === current) ? current : null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPatient = useCallback(async (input: PatientInput) => {
    setError(null);
    try {
      const created = await patientApi.createPatient(input);
      setPatients(current => sortPatients([...current, created]));
      setSelectedPatientId(created.id);
      return created;
    } catch (mutationError) {
      const message = errorMessage(mutationError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updatePatient = useCallback(async (id: string, input: PatientInput) => {
    setError(null);
    try {
      const updated = await patientApi.updatePatient(id, input);
      setPatients(current => sortPatients(current.map(patient => patient.id === id ? updated : patient)));
      return updated;
    } catch (mutationError) {
      const message = errorMessage(mutationError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    setError(null);
    try {
      await patientApi.deletePatient(id);
      setPatients(current => current.filter(patient => patient.id !== id));
      setSelectedPatientId(current => current === id ? null : current);
    } catch (mutationError) {
      const message = errorMessage(mutationError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const selectedPatient = useMemo(
    () => patients.find(patient => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  return {
    patients,
    selectedPatient,
    selectedPatientId,
    isLoading,
    error,
    refresh,
    selectPatient: setSelectedPatientId,
    createPatient,
    updatePatient,
    deletePatient
  };
}
