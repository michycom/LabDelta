import { useEffect, useState, type FormEvent } from "react";
import type { Patient, PatientInput } from "../types";

const emptyInput: PatientInput = {
  displayName: "",
  dateOfBirth: "",
  sexReferenceContext: null,
  externalIdentifier: null
};

function inputForPatient(patient: Patient | null): PatientInput {
  return patient ? {
    displayName: patient.displayName,
    dateOfBirth: patient.dateOfBirth,
    sexReferenceContext: patient.sexReferenceContext,
    externalIdentifier: patient.externalIdentifier
  } : emptyInput;
}

function validate(input: PatientInput): string | null {
  if (!input.displayName.trim()) return "Patient name is required.";
  if (!input.dateOfBirth) return "Date of birth is required.";
  const parsed = new Date(`${input.dateOfBirth}T00:00:00`);
  if (Number.isNaN(parsed.valueOf())) return "Date of birth must be valid.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) return "Date of birth cannot be in the future.";
  return null;
}

export function PatientForm({ patient, onSave, onCancel }: {
  patient: Patient | null;
  onSave: (input: PatientInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<PatientInput>(() => inputForPatient(patient));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInput(inputForPatient(patient));
    setValidationError(null);
  }, [patient]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = validate(input);
    if (message) {
      setValidationError(message);
      return;
    }
    setIsSaving(true);
    setValidationError(null);
    try {
      await onSave({
        ...input,
        displayName: input.displayName.trim(),
        sexReferenceContext: input.sexReferenceContext?.trim() || null,
        externalIdentifier: input.externalIdentifier?.trim() || null
      });
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="modal-backdrop"><section aria-labelledby="patient-form-title" aria-modal="true" className="patient-modal" role="dialog">
    <h2 id="patient-form-title">{patient ? "Edit patient" : "New patient"}</h2>
    <p>Store the patient identity locally. Name and date of birth are required.</p>
    <form onSubmit={event => void submit(event)}>
      <label>Patient name<input autoFocus name="displayName" value={input.displayName} onChange={event => setInput(current => ({ ...current, displayName: event.target.value }))} /></label>
      <label>Date of birth<input name="dateOfBirth" type="date" value={input.dateOfBirth} onChange={event => setInput(current => ({ ...current, dateOfBirth: event.target.value }))} /></label>
      <label>Sex / reference context<input name="sexReferenceContext" value={input.sexReferenceContext ?? ""} onChange={event => setInput(current => ({ ...current, sexReferenceContext: event.target.value }))} /></label>
      <label>External identifier<input name="externalIdentifier" value={input.externalIdentifier ?? ""} onChange={event => setInput(current => ({ ...current, externalIdentifier: event.target.value }))} /></label>
      {validationError && <p className="form-error" role="alert">{validationError}</p>}
      <div className="modal-actions"><button disabled={isSaving} type="button" onClick={onCancel}>Cancel</button><button className="primary" disabled={isSaving} type="submit">{isSaving ? "Saving…" : "Save patient"}</button></div>
    </form>
  </section></div>;
}
