import { CalendarDays, Check, ChevronDown, MoreVertical } from "lucide-react";

export function Header({ patientSelected, onToggle }: { patientSelected: boolean; onToggle: () => void }) {
  return <header className="topbar">
    <button className="patient-picker" type="button" onClick={onToggle}>
      <span className="step">0</span>
      <span><strong>{patientSelected ? "Müller, Anna" : "Quick selection — no patient selected"}</strong><small>{patientSelected ? "12.03.1985 · ID: P-10023" : "Choose a patient to open detail views."}</small></span>
      <ChevronDown size={18} />
    </button>
    <label className="period">Period <button type="button">Last 6 months <CalendarDays size={17} /></button></label>
    <div className="data-status"><Check size={17} /> Data status: <strong>Current</strong></div>
    <button className="icon-button" aria-label="More options" type="button"><MoreVertical size={18} /></button>
  </header>;
}

