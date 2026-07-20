import { ArrowDown, ArrowRight, ArrowUp, Database, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/patients";
import { mathematicalChangeLabel, referenceStatusLabel } from "../terminology";
import type { DashboardFilter, DashboardValueDetail, DashboardView, ReferenceStatus } from "../types";

const filters: Array<[DashboardFilter, string]> = [
  ["all", "All"],
  ["outsideReference", "Outside reference"],
  ["changed", "Changed"],
  ["longitudinalData", "Longitudinal data"]
];

function message(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);
}

export function DashboardOverview({ onOpenPatient, revealValueDetailForPatient }: { onOpenPatient: (patientId: string) => void; revealValueDetailForPatient?: string | null }) {
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [dashboard, setDashboard] = useState<DashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<DashboardValueDetail | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setError(null);
    void getDashboard(filter).then(result => {
      if (current) setDashboard(result);
    }).catch(reason => {
      if (current) setError(message(reason));
    }).finally(() => {
      if (current) setIsLoading(false);
    });
    return () => { current = false; };
  }, [filter, reload]);

  useEffect(() => {
    if (!revealValueDetailForPatient || !dashboard) return;
    const detail = dashboard.patients.find(patient => patient.displayName === revealValueDetailForPatient)?.highlights[0];
    if (detail) setSelectedValue(detail);
  }, [dashboard, revealValueDetailForPatient]);

  if (isLoading) return <DashboardState text="Loading approved dashboard data from local SQLite…" />;
  if (error) return <DashboardState error text={error} action={() => setReload(value => value + 1)} />;

  return <section className="contest-dashboard" data-demo-target="dashboard">
    <div className="dashboard-heading">
      <div><span className="section-kicker"><Database size={15} /> Contest dashboard</span><h1>Approved synthetic patients</h1><p>Report Reference is used for every status shown here.</p></div>
      <div className="dashboard-filters" aria-label="Dashboard filters">{filters.map(([id, label]) => <button aria-pressed={filter === id} className={filter === id ? "selected" : ""} key={id} onClick={() => setFilter(id)} type="button">{label}</button>)}</div>
    </div>
    <p className="sort-note"><strong>Deterministic order:</strong> {dashboard?.sortExplanation}</p>
    {!dashboard?.patients.length ? <DashboardState compact text="No approved demo patients match this filter." /> : <div className="dashboard-patient-grid">{dashboard.patients.map(patient => <article className="dashboard-patient-card" data-demo-target={patient.displayName === "Dirk Mayer" ? "patient-dirk-mayer" : undefined} key={patient.id}>
      <button className="patient-card-heading" onClick={() => onOpenPatient(patient.id)} type="button"><span><strong>{patient.displayName}</strong><small>Latest report {patient.latestReportDate}</small></span><ArrowRight size={18} /></button>
      <div className="patient-metrics"><span><b>{patient.reportCount}</b> reports</span><span><b>{patient.confirmedValueCount}</b> confirmed values</span></div>
      <div className="status-counts" aria-label={`${patient.displayName} reference status counts`}>
        <StatusCount status="below" value={patient.referenceCounts.below} />
        <StatusCount status="within" value={patient.referenceCounts.within} />
        <StatusCount status="above" value={patient.referenceCounts.above} />
        <StatusCount status="notAssessable" value={patient.referenceCounts.notAssessable} />
      </div>
      <div className="dashboard-profiles"><h2>Static profiles</h2>{patient.profiles.map(profile => <div key={`${profile.id}-${profile.version}`}><strong>{profile.name} <small>v{profile.version}</small></strong><span>{profile.assignedParameterCount} assigned · {profile.presentParameterCount} present · {profile.outsideReferenceCount} outside</span></div>)}</div>
      <div className="dashboard-highlights"><h2>Transparent mathematical highlights</h2>{patient.highlights.length ? patient.highlights.map(value => <button key={value.workingValueId} onClick={() => setSelectedValue(value)} type="button"><StatusDot status={value.referenceStatus} /><span><strong>{value.parameterName}</strong><small>{value.currentValue} {value.unit ?? ""} · {referenceStatusLabel(value.referenceStatus)} · <Direction value={value.direction} /> {value.absoluteDifference ?? "—"}</small></span><ArrowRight size={15} /></button>) : <p>No outside value or mathematical change in the latest report.</p>}</div>
    </article>)}</div>}
    {selectedValue ? <ValueDetail value={selectedValue} onClose={() => setSelectedValue(null)} /> : null}
  </section>;
}

function StatusDot({ status }: { status: ReferenceStatus }) { return <i aria-hidden="true" className={`reference-dot ${status}`} />; }
function StatusCount({ status, value }: { status: ReferenceStatus; value: number }) { return <span><StatusDot status={status} /><b>{value}</b> {referenceStatusLabel(status)}</span>; }
function Direction({ value }: { value: DashboardValueDetail["direction"] }) {
  if (value === "higher") return <><ArrowUp size={12} />{mathematicalChangeLabel(value)}</>;
  if (value === "lower") return <><ArrowDown size={12} />{mathematicalChangeLabel(value)}</>;
  return <>{mathematicalChangeLabel(value)}</>;
}
function DashboardState({ text, error = false, compact = false, action }: { text: string; error?: boolean; compact?: boolean; action?: () => void }) { return <div className={`demo-state ${error ? "error-state" : ""} ${compact ? "compact" : ""}`} role={error ? "alert" : undefined}><strong>{text}</strong>{action ? <button className="outline-button" onClick={action} type="button"><RefreshCw size={14} />Retry</button> : null}</div>; }
function ValueDetail({ value, onClose }: { value: DashboardValueDetail; onClose: () => void }) { return <div className="dashboard-detail-backdrop" role="presentation"><aside aria-label={`${value.parameterName} mathematical detail`} className="dashboard-value-detail" data-demo-target="value-explanation"><button aria-label="Close detail" className="detail-close" onClick={onClose} type="button"><X size={17} /></button><span className="section-kicker">Compact data explanation</span><h2>{value.parameterName}</h2><dl><dt>Current</dt><dd>{value.currentValue} {value.unit}</dd><dt>Previous</dt><dd>{value.previousValue ?? "Not available"} {value.previousValue ? value.unit : ""}</dd><dt>Supplied reference</dt><dd>{value.suppliedReference ?? referenceStatusLabel("notAssessable")}</dd><dt>Reference status</dt><dd><StatusDot status={value.referenceStatus} />{referenceStatusLabel(value.referenceStatus)}</dd><dt>Difference</dt><dd>{value.absoluteDifference ?? mathematicalChangeLabel("noComparison")}{value.relativeDifferencePercent ? ` (${value.relativeDifferencePercent}%)` : ""} · <Direction value={value.direction} /></dd><dt>Report dates</dt><dd>{value.currentReportDate}{value.previousReportDate ? `; previous ${value.previousReportDate}` : ""}</dd><dt>Profiles</dt><dd>{value.profileTags.join(", ") || "No assigned profile"}</dd><dt>Original label</dt><dd>{value.originalParameterName}</dd><dt>Source</dt><dd>{value.originalDocumentName} · {value.provenanceLabel}</dd><dt>Excerpt</dt><dd>{value.provenanceExcerpt ?? "No excerpt stored"}</dd><dt>Rules</dt><dd><code>{value.referenceRuleId}@{value.referenceRuleVersion}</code><br /><code>{value.comparisonRuleId}@{value.comparisonRuleVersion}</code></dd></dl></aside></div>; }
