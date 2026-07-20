import { ChevronDown, Database, LockKeyhole } from "lucide-react";
import type { PatientListItem } from "../types";
import type { ReferenceCatalogParameter, ReferenceSource } from "../types";

export function Header({ patient, referenceSources, selectedReferenceSource, referenceCatalogParameters, referenceSourcesError, onOpenPatients, onSelectReferenceSource }: {
  patient: PatientListItem | null;
  referenceSources: ReferenceSource[];
  selectedReferenceSource: ReferenceSource | null;
  referenceCatalogParameters: ReferenceCatalogParameter[];
  referenceSourcesError: string | null;
  onOpenPatients: () => void;
  onSelectReferenceSource: (sourceId: string) => void;
}) {
  return <header className="topbar">
    <button aria-label={patient ? `Selected patient ${patient.displayName} ${patient.id}` : "Choose synthetic demo patient"} className="patient-picker" type="button" onClick={onOpenPatients}>
      <span><strong>{patient ? patient.displayName : "No synthetic demo patient selected"}</strong><small>{patient ? `${patient.dateOfBirth} · ID: ${patient.id}` : "Choose a seeded patient to open its reports."}</small></span>
      <ChevronDown size={18} />
    </button>
    <div className="reference-source-picker">
      <label htmlFor="reference-source">Reference source</label>
      <select id="reference-source" value={selectedReferenceSource?.id ?? ""} onChange={event => onSelectReferenceSource(event.target.value)} disabled={referenceSources.length === 0}>
        {referenceSources.map(source => <option disabled={source.availability === "futureDisabled"} key={`${source.id}-${source.version}`} value={source.id}>{source.displayName}{source.availability === "futureDisabled" ? " (future - disabled)" : ""}</option>)}
      </select>
      {referenceSourcesError ? <small role="alert">{referenceSourcesError}</small> : selectedReferenceSource ? <small>{selectedReferenceSource.sourceNotice}{selectedReferenceSource.demonstrationOnly ? ` ${referenceCatalogParameters.length} synthetic parameters available; not applied automatically.` : ""}</small> : <small>Loading local reference sources…</small>}
    </div>
    <div className="data-status"><Database size={17} /> <strong>Local SQLite</strong></div>
    <div className="data-status"><LockKeyhole size={17} /> <strong>Read-only</strong></div>
  </header>;
}
