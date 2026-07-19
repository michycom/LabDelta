import { CalendarDays, Check, ChevronDown, MoreVertical } from "lucide-react";
import type { Patient } from "../types";

export function Header({ patient, onOpenPatients }: { patient: Patient | null; onOpenPatients: () => void }) {
  return <header className="topbar">
    <button aria-label={patient ? `Selected patient ${patient.displayName} ${patient.id}` : "Choose patient"} className="patient-picker" type="button" onClick={onOpenPatients}>
      <span className="step">0</span>
      <span><strong>{patient ? patient.displayName : "Quick selection — no patient selected"}</strong><small>{patient ? `${patient.dateOfBirth} · ID: ${patient.id}` : "Choose a patient to open detail views."}</small></span>
      <ChevronDown size={18} />
    </button>
    <label className="period">Period <button type="button">Last 6 months <CalendarDays size={17} /></button></label>
    <div className="data-status"><Check size={17} /> Data status: <strong>Current</strong></div>
    <button className="icon-button" aria-label="More options" type="button"><MoreVertical size={18} /></button>
  </header>;
}
