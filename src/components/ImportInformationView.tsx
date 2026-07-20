import { CheckCircle2, FileLock2, FileUp, ShieldCheck, UserRound } from "lucide-react";
import type { PatientListItem } from "../types";
import { CollapsiblePanel } from "./CollapsiblePanel";

export function ImportInformationView({ patient }: { patient: PatientListItem | null }) {
  return <section className="information-view import-information-view">
    <CollapsiblePanel demoTarget="import-information" storageKey="import" subtitle="Read-only Contest Demo boundary" title="Import">
      <div className="import-information-grid">
        <div className="disabled-dropzone" aria-disabled="true"><FileUp size={30} /><strong>Manual file selection disabled</strong><span>No drag-and-drop target or file dialog is registered.</span><button disabled type="button">Choose file</button></div>
        <section className="import-information-card"><FileLock2 size={20} /><div><strong>Documented fixture artifacts</strong><p>JSON · CSV · selectable-text PDF</p><small>Artifact formats are shown for transparency only. No parser or import operation runs here.</small></div></section>
        <section className="import-information-card security"><ShieldCheck size={20} /><div><strong>Safety boundary</strong><ul><li><CheckCircle2 size={14} /> Approved synthetic fixture manifest only</li><li><CheckCircle2 size={14} /> Checksums remain enforced by the existing seed</li><li><CheckCircle2 size={14} /> No real patient data path</li></ul></div></section>
        <section className="import-information-card"><UserRound size={20} /><div><strong>Patient assignment</strong><p>{patient ? `${patient.displayName} · ${patient.id}` : "No synthetic patient selected"}</p><small>Assignment is display-only; this view cannot modify stored data.</small></div></section>
      </div>
      <p className="import-disabled-statement">Manual import is disabled in the Contest Demo. LabDelta uses only approved synthetic fixtures.</p>
    </CollapsiblePanel>
  </section>;
}
