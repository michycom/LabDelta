import { ChevronDown, Database, LockKeyhole } from "lucide-react";
import type { PatientListItem } from "../types";

export function Header({ patient, onOpenPatients }: { patient: PatientListItem | null; onOpenPatients: () => void }) {
  return <header className="topbar">
    <button aria-label={patient ? `Selected patient ${patient.displayName} ${patient.id}` : "Choose synthetic demo patient"} className="patient-picker" type="button" onClick={onOpenPatients}>
      <span className="step">1</span>
      <span><strong>{patient ? patient.displayName : "No synthetic demo patient selected"}</strong><small>{patient ? `${patient.dateOfBirth} · ID: ${patient.id}` : "Choose a seeded patient to open its reports."}</small></span>
      <ChevronDown size={18} />
    </button>
    <div className="data-status"><Database size={17} /> Source: <strong>Local SQLite</strong></div>
    <div className="data-status"><LockKeyhole size={17} /> Access: <strong>Read-only demo</strong></div>
  </header>;
}
