import { Database, FileText, MapPin, RefreshCw, UserRound } from "lucide-react";
import type { ConfirmedReportValue, LaboratoryReport, PatientDetails, PatientListItem, ProvenanceLocator } from "../types";

interface DemoDataWorkspaceProps {
  patients: PatientListItem[];
  selectedPatient: PatientListItem | null;
  patientDetails: PatientDetails | null;
  reports: LaboratoryReport[];
  selectedReport: LaboratoryReport | null;
  values: ConfirmedReportValue[];
  isLoadingPatients: boolean;
  isLoadingPatientData: boolean;
  isLoadingValues: boolean;
  patientsError: string | null;
  patientDataError: string | null;
  valuesError: string | null;
  onRefreshPatients: () => Promise<void>;
  onSelectPatient: (patientId: string) => void;
  onSelectReport: (reportId: string) => void;
}

function locatorLabel(locator: ProvenanceLocator): string {
  switch (locator.kind) {
    case "jsonPath":
      return `JSON path: ${locator.path}`;
    case "page":
      return `Page: ${locator.pageNumber}`;
    case "tableCell":
      return `Row ${locator.rowNumber}, column ${locator.columnName}`;
    case "textSpan":
      return `Text offset ${locator.startOffset}–${locator.endOffset}`;
    case "document":
      return "Document-level source";
  }
}

function confirmedValueText(value: ConfirmedReportValue): string {
  return value.confirmedValue.value;
}

export function DemoDataWorkspace(props: DemoDataWorkspaceProps) {
  if (props.isLoadingPatients) {
    return <section className="demo-state" aria-live="polite">Loading approved demo patients from local SQLite…</section>;
  }
  if (props.patientsError) {
    return <section className="demo-state error-state" role="alert"><strong>Demo patients could not be loaded.</strong><span>{props.patientsError}</span><button className="outline-button" type="button" onClick={() => void props.onRefreshPatients()}><RefreshCw size={15} /> Retry</button></section>;
  }
  if (props.patients.length === 0) {
    return <section className="demo-state"><Database size={32} /><strong>No approved demo patients are stored.</strong><span>The local database returned an empty patient list.</span></section>;
  }

  return <div className="demo-data-layout">
    <aside className="demo-patient-list" aria-label="Approved demo patients">
      <div className="demo-section-heading"><div><span>Local SQLite</span><h1>Synthetic demo patients</h1></div><button aria-label="Refresh demo patients" className="icon-button" type="button" onClick={() => void props.onRefreshPatients()}><RefreshCw size={16} /></button></div>
      {props.patients.map(patient => <button className={patient.id === props.selectedPatient?.id ? "demo-patient-option selected" : "demo-patient-option"} key={patient.id} type="button" onClick={() => props.onSelectPatient(patient.id)}><UserRound size={17} /><span><strong>{patient.displayName}</strong><small>{patient.dateOfBirth} · {patient.id}</small></span></button>)}
    </aside>

    <section className="demo-record-view" aria-label="Selected patient demo records">
      {props.isLoadingPatientData ? <div className="demo-state compact" aria-live="polite">Loading patient details and laboratory reports…</div> : props.patientDataError ? <div className="demo-state compact error-state" role="alert"><strong>Patient data could not be loaded.</strong><span>{props.patientDataError}</span></div> : props.patientDetails ? <>
        <header className="demo-record-header"><div className="avatar">{props.patientDetails.displayName.split(" ").map(part => part[0]).join("")}</div><div><span>Selected synthetic patient</span><h2>{props.patientDetails.displayName}</h2><p>Date of birth: {props.patientDetails.dateOfBirth} · Reference context: {props.patientDetails.sexReferenceContext ?? "Not supplied"} · Demo ID: {props.patientDetails.externalIdentifier ?? "Not supplied"}</p>{props.patientDetails.bodyMeasurements.length > 0 && <p>{props.patientDetails.bodyMeasurements.map(item => `${item.kind}: ${item.originalValueText} ${item.originalUnit} (${item.verificationStatus})`).join(" · ")}</p>}</div></header>

        <section className="profile-assignment-panel" aria-labelledby="assigned-profiles-title" data-demo-target="assigned-profiles"><div><span>Static organization only</span><h3 id="assigned-profiles-title">Assigned profiles</h3><p>Transparent fixture assignments; no diagnosis, scoring, or automatic interpretation.</p></div><div className="profile-assignment-list">{props.patientDetails.profiles.map(profile => <article key={`${profile.id}-${profile.version}`}><strong>{profile.name} <small>v{profile.version}</small></strong><span>{profile.parameterNames.join(", ")}</span></article>)}</div></section>

        <div className="demo-report-layout">
          <nav className="demo-report-list" aria-label="Laboratory reports" data-demo-target="report-history">
            <h3><FileText size={16} /> Laboratory reports</h3>
            {props.reports.length === 0 ? <p className="inline-empty">No laboratory reports are stored for this patient.</p> : props.reports.map(report => <button className={report.id === props.selectedReport?.id ? "demo-report-option selected" : "demo-report-option"} key={report.id} type="button" onClick={() => props.onSelectReport(report.id)}><strong>{report.specimenCollectedAt ?? "Specimen time not supplied"}</strong><span>{report.laboratoryName ?? "Laboratory not supplied"}</span><small>Revision {report.revisionNumber ?? "not supplied"}</small></button>)}
          </nav>

          <div className="demo-report-detail">
            {props.selectedReport ? <>
              <div className="report-metadata"><div><span>Specimen collected</span><strong>{props.selectedReport.specimenCollectedAt ?? "Not supplied"}</strong></div><div><span>Laboratory</span><strong>{props.selectedReport.laboratoryName ?? "Not supplied"}</strong></div><div><span>Report released</span><strong>{props.selectedReport.reportReleasedAt ?? "Not supplied"}</strong></div></div>
              {props.isLoadingValues ? <div className="demo-state compact" aria-live="polite">Loading explicitly confirmed values…</div> : props.valuesError ? <div className="demo-state compact error-state" role="alert"><strong>Confirmed values could not be loaded.</strong><span>{props.valuesError}</span></div> : props.values.length === 0 ? <div className="demo-state compact"><strong>No explicitly confirmed working values are stored for this report.</strong></div> : <div className="confirmed-values-wrap" data-demo-target="confirmed-values"><table className="confirmed-values"><thead><tr><th>Original parameter</th><th>Confirmed value</th><th>Unit</th><th>Supplied reference</th><th>Provenance / source location</th></tr></thead><tbody>{props.values.map((value, index) => <tr data-demo-target={index === 0 ? "provenance" : undefined} key={value.id}><td><strong>{value.original.parameterName}</strong><small>Original text: {value.original.valueText}</small></td><td><strong>{confirmedValueText(value)}</strong><small>Explicitly confirmed · version {value.versionNumber}</small></td><td>{value.unit ?? "Not supplied"}</td><td>{value.original.suppliedReferenceRange ?? "Not supplied"}</td><td><span className="provenance-line"><MapPin size={14} /> {locatorLabel(value.provenance.locator)}</span><small>{value.provenance.textExcerpt ?? "No excerpt supplied"}</small><small>Source: {value.original.document.originalFileName}</small></td></tr>)}</tbody></table></div>}
            </> : props.reports.length > 0 ? <div className="demo-state compact">Select a laboratory report.</div> : null}
          </div>
        </div>
      </> : <div className="demo-state compact">Select a synthetic demo patient.</div>}
    </section>
  </div>;
}
