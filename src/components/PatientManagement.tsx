import { RefreshCw, UserCheck, Users } from "lucide-react";
import type { PatientListItem } from "../types";

export function PatientManagement({ patients, selectedPatientId, isLoading, error, onRefresh, onSelect }: {
  patients: PatientListItem[];
  selectedPatientId: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onSelect: (id: string) => void;
}) {
  return <section className="patient-management" aria-labelledby="patients-title">
    <div className="management-header"><div><span className="section-kicker"><Users size={17} /> Read-only local demo data</span><h1 id="patients-title">Synthetic patients</h1><p>This list is read from the local LabDelta SQLite database and contains only approved demo fixtures.</p></div><div><button className="outline-button" disabled={isLoading} type="button" onClick={() => void onRefresh()}><RefreshCw size={15} /> Refresh</button></div></div>
    {error && <div className="management-error" role="alert">{error}</div>}
    {isLoading ? <div className="patient-empty">Loading approved demo patients…</div> : patients.length === 0 ? <div className="patient-empty"><Users size={34} /><h2>No approved demo patients</h2><p>The local database returned an empty patient list.</p></div> : <div className="patient-table-wrap"><table className="patient-table"><thead><tr><th>Patient</th><th>Date of birth</th><th>Archive status</th><th>Stable local ID</th><th>Action</th></tr></thead><tbody>{patients.map(patient => <tr className={patient.id === selectedPatientId ? "selected-row" : ""} key={patient.id}><td><strong>{patient.displayName}</strong>{patient.id === selectedPatientId && <span className="selected-label"><UserCheck size={13} /> Selected</span>}</td><td>{patient.dateOfBirth}</td><td>{patient.isArchived ? "Archived" : "Active demo record"}</td><td><code>{patient.id}</code></td><td><button type="button" onClick={() => onSelect(patient.id)}>{patient.id === selectedPatientId ? "Open selected patient" : "Open patient"}</button></td></tr>)}</tbody></table></div>}
  </section>;
}
