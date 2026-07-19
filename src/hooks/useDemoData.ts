import { useCallback, useEffect, useMemo, useState } from "react";
import * as patientApi from "../api/patients";
import type { CommandFailure, ConfirmedReportValue, LaboratoryReport, PatientDetails, PatientListItem } from "../types";

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as CommandFailure).message);
  }
  return error instanceof Error ? error.message : String(error);
}

export function useDemoData() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [reports, setReports] = useState<LaboratoryReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [values, setValues] = useState<ConfirmedReportValue[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [patientDataError, setPatientDataError] = useState<string | null>(null);
  const [valuesError, setValuesError] = useState<string | null>(null);

  const refreshPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const loadedPatients = await patientApi.listPatients();
      setPatients(loadedPatients);
      setSelectedPatientId(current => current && loadedPatients.some(patient => patient.id === current)
        ? current
        : loadedPatients[0]?.id ?? null);
    } catch (error) {
      setPatients([]);
      setSelectedPatientId(null);
      setPatientsError(errorMessage(error));
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    void refreshPatients();
  }, [refreshPatients]);

  useEffect(() => {
    let isCurrent = true;
    setPatientDetails(null);
    setReports([]);
    setSelectedReportId(null);
    setPatientDataError(null);
    if (!selectedPatientId) {
      setIsLoadingPatientData(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoadingPatientData(true);
    const load = async () => {
      try {
        const details = await patientApi.getPatientDetails(selectedPatientId);
        const loadedReports = await patientApi.listLaboratoryReports(selectedPatientId);
        if (!isCurrent) return;
        setPatientDetails(details);
        setReports(loadedReports);
        setSelectedReportId(loadedReports[0]?.id ?? null);
      } catch (error) {
        if (!isCurrent) return;
        setPatientDataError(errorMessage(error));
      } finally {
        if (isCurrent) setIsLoadingPatientData(false);
      }
    };
    void load();
    return () => {
      isCurrent = false;
    };
  }, [selectedPatientId]);

  useEffect(() => {
    let isCurrent = true;
    setValues([]);
    setValuesError(null);
    if (!selectedReportId) {
      setIsLoadingValues(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoadingValues(true);
    const load = async () => {
      try {
        const loadedValues = await patientApi.listConfirmedReportValues(selectedReportId);
        if (isCurrent) setValues(loadedValues);
      } catch (error) {
        if (isCurrent) setValuesError(errorMessage(error));
      } finally {
        if (isCurrent) setIsLoadingValues(false);
      }
    };
    void load();
    return () => {
      isCurrent = false;
    };
  }, [selectedReportId]);

  const selectedPatient = useMemo(
    () => patients.find(patient => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );
  const selectedReport = useMemo(
    () => reports.find(report => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  return {
    patients,
    selectedPatient,
    selectedPatientId,
    patientDetails,
    reports,
    selectedReport,
    selectedReportId,
    values,
    isLoadingPatients,
    isLoadingPatientData,
    isLoadingValues,
    patientsError,
    patientDataError,
    valuesError,
    refreshPatients,
    selectPatient: setSelectedPatientId,
    selectReport: setSelectedReportId
  };
}
