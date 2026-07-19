import { Edit3, Plus, RefreshCw, Trash2, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import type { Patient, PatientInput } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { PatientForm } from "./PatientForm";

export function PatientManagement({ patients, selectedPatientId, isLoading, error, onRefresh, onSelect, onCreate, onUpdate, onDelete }: {
  patients: Patient[];
  selectedPatientId: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onSelect: (id: string) => void;
  onCreate: (input: PatientInput) => Promise<Patient>;
  onUpdate: (id: string, input: PatientInput) => Promise<Patient>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [formPatient, setFormPatient] = useState<Patient | "new" | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const save = async (input: PatientInput) => {
    if (formPatient === "new") await onCreate(input);
    else if (formPatient) await onUpdate(formPatient.id, input);
    setFormPatient(null);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch {
      // The patient state exposes the command error in the management view.
    } finally {
      setIsDeleting(false);
    }
  };

  return <section className="patient-management" aria-labelledby="patients-title">
    <div className="management-header"><div><span className="section-kicker"><Users size={17} /> Local patient management</span><h1 id="patients-title">Patients</h1><p>Patient identities are stored only in the local LabDelta SQLite database.</p></div><div><button className="outline-button" disabled={isLoading} type="button" onClick={() => void onRefresh()}><RefreshCw size={15} /> Refresh</button><button className="primary-button" type="button" onClick={() => setFormPatient("new")}><Plus size={16} /> New patient</button></div></div>
    {error && <div className="management-error" role="alert">{error}</div>}
    {isLoading ? <div className="patient-empty">Loading local patients…</div> : patients.length === 0 ? <div className="patient-empty"><Users size={34} /><h2>No patients yet</h2><p>Create the first patient to establish a local patient context.</p><button className="primary-button" type="button" onClick={() => setFormPatient("new")}><Plus size={16} /> New patient</button></div> : <div className="patient-table-wrap"><table className="patient-table"><thead><tr><th>Patient</th><th>Date of birth</th><th>Sex / reference context</th><th>External identifier</th><th>Local ID</th><th>Actions</th></tr></thead><tbody>{patients.map(patient => <tr className={patient.id === selectedPatientId ? "selected-row" : ""} key={patient.id}><td><strong>{patient.displayName}</strong>{patient.id === selectedPatientId && <span className="selected-label"><UserCheck size={13} /> Selected</span>}</td><td>{patient.dateOfBirth}</td><td>{patient.sexReferenceContext ?? "Not specified"}</td><td>{patient.externalIdentifier ?? "Not specified"}</td><td><code>{patient.id}</code></td><td><div className="row-actions"><button type="button" onClick={() => onSelect(patient.id)}>{patient.id === selectedPatientId ? "Selected" : "Select"}</button><button aria-label={`Edit ${patient.displayName}`} type="button" onClick={() => setFormPatient(patient)}><Edit3 size={15} /></button><button aria-label={`Delete ${patient.displayName}`} className="delete-icon" type="button" onClick={() => setDeleteCandidate(patient)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    {formPatient && <PatientForm patient={formPatient === "new" ? null : formPatient} onSave={save} onCancel={() => setFormPatient(null)} />}
    {deleteCandidate && <ConfirmDialog patient={deleteCandidate} isDeleting={isDeleting} onCancel={() => setDeleteCandidate(null)} onConfirm={confirmDelete} />}
  </section>;
}
