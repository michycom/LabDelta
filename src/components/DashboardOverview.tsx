import { ArrowDown, ArrowRight, ArrowUp, Minus, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/patients";
import { parameterAnchorKey } from "../data/syntheticDocument";
import { mathematicalChangeLabel, referenceStatusLabel } from "../terminology";
import type { DashboardFilter, DashboardPatient, DashboardValueDetail, DashboardView, MathematicalDirection, ReferenceStatus } from "../types";
import { CollapsiblePanel } from "./CollapsiblePanel";

const filters: Array<[DashboardFilter, string]> = [
  ["all", "Alle"],
  ["outsideReference", "Auffällig"],
  ["changed", "Deutlich verändert"],
  ["longitudinalData", "Mit Langzeittrend"]
];
const initiallyVisibleChanges = 3;

function message(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);
}

export function DashboardOverview({ onOpenPatient, revealValueDetailForPatient, selectedPatientId }: { onOpenPatient: (patientId: string) => void; revealValueDetailForPatient?: string | null; selectedPatientId?: string | null }) {
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [dashboards, setDashboards] = useState<Partial<Record<DashboardFilter, DashboardView>>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<DashboardValueDetail | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setError(null);
    void Promise.all(filters.map(async ([id]) => [id, await getDashboard(id)] as const)).then(results => {
      if (current) setDashboards(Object.fromEntries(results) as Record<DashboardFilter, DashboardView>);
    }).catch(reason => {
      if (current) setError(message(reason));
    }).finally(() => {
      if (current) setIsLoading(false);
    });
    return () => { current = false; };
  }, [reload]);

  const dashboard = dashboards[filter];

  useEffect(() => {
    if (!revealValueDetailForPatient || !dashboard) return;
    const detail = dashboard.patients.find(patient => patient.displayName === revealValueDetailForPatient)?.highlights[0];
    if (detail) setSelectedValue(detail);
  }, [dashboard, revealValueDetailForPatient]);

  function toggleExpanded(patientId: string) {
    setExpandedPatients(current => {
      const next = new Set(current);
      if (next.has(patientId)) next.delete(patientId); else next.add(patientId);
      return next;
    });
  }

  if (isLoading) return <DashboardState text="Loading approved dashboard data from local SQLite…" />;
  if (error) return <DashboardState error text={error} action={() => setReload(value => value + 1)} />;

  return <section className="contest-dashboard patient-overview" data-demo-target="dashboard">
    <CollapsiblePanel demoTarget="dashboard-overview" storageKey="dashboard" subtitle="Überblick über alle Patienten" title="Dashboard – Auffällige Veränderungen">
      <div className="dashboard-toolbar">
        <div className="dashboard-filters" data-demo-target="dashboard-filters" aria-label="Dashboard filters">{filters.map(([id, label]) => <button aria-pressed={filter === id} className={filter === id ? "selected" : ""} key={id} onClick={() => setFilter(id)} type="button">{label}<b>{dashboards[id]?.patients.length ?? 0}</b></button>)}</div>
      </div>
      {!dashboard?.patients.length ? <DashboardState compact text="Keine freigegebenen Demo-Patienten entsprechen diesem Filter." /> : <div className="patient-overview-table-wrap" data-demo-target="dashboard-patient-table">
        <table className="patient-overview-table">
          <colgroup><col /><col /><col /><col /><col /><col /></colgroup>
          <thead><tr><th>Patient</th><th>Letzter Bericht</th><th>Auffällige / deutlich veränderte Werte</th><th>Betroffene Laborprofile</th><th>Wichtigste Veränderungen</th><th>Trend-Zusammenfassung</th></tr></thead>
          <tbody>{dashboard.patients.map(patient => <PatientRow expanded={expandedPatients.has(patient.id)} isSelected={patient.id === selectedPatientId} key={patient.id} onOpenPatient={onOpenPatient} onSelectValue={setSelectedValue} onToggleExpanded={toggleExpanded} patient={patient} />)}</tbody>
        </table>
      </div>}
      <div className="patient-overview-legend" aria-label="Legend"><span><StatusDot status="within" />{referenceStatusLabel("within")}</span><span><StatusDot status="above" />{referenceStatusLabel("above")} / {referenceStatusLabel("below")}</span><span><StatusDot status="notAssessable" />{referenceStatusLabel("notAssessable")}</span><span><ArrowUp size={13} />{mathematicalChangeLabel("higher")}</span><span><ArrowDown size={13} />{mathematicalChangeLabel("lower")}</span><span><Minus size={13} />{mathematicalChangeLabel("equal")}</span></div>
      {selectedValue ? <ValueDetail value={selectedValue} onClose={() => setSelectedValue(null)} /> : null}
    </CollapsiblePanel>
  </section>;
}

function PatientRow({ patient, expanded, isSelected, onOpenPatient, onSelectValue, onToggleExpanded }: { patient: DashboardPatient; expanded: boolean; isSelected: boolean; onOpenPatient: (patientId: string) => void; onSelectValue: (value: DashboardValueDetail) => void; onToggleExpanded: (patientId: string) => void }) {
  const affectedProfiles = patient.profiles.filter(profile => profile.outsideReferenceCount > 0 || patient.highlights.some(value => value.profileTags.includes(profile.name)));
  const visibleChanges = expanded ? patient.highlights : patient.highlights.slice(0, initiallyVisibleChanges);
  const trends = countDirections(patient.highlights);
  const openPatient = () => onOpenPatient(patient.id);
  return <tr className={isSelected ? "selected-patient-row" : ""} data-demo-target={patient.displayName === "Dirk Mayer" ? "patient-dirk-mayer" : undefined} onClick={openPatient} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") openPatient(); }} role="link" tabIndex={0}>
    <td><div className="overview-patient"><i aria-hidden="true" className="patient-status-dot" /><span><strong>{patient.displayName}</strong><small>{patient.reportCount} Berichte</small></span><ArrowRight size={15} /></div></td>
    <td><strong>{formatReportDate(patient.latestReportDate)}</strong></td>
    <td><div className="overview-count"><strong>{patient.highlights.length} / {assessableCount(patient)}</strong><span>Auffällige Werte</span></div></td>
    <td>{affectedProfiles.length ? <div className="affected-profile-list"><span>{affectedProfiles.map(profile => profile.name).join(", ")} <b>({affectedProfiles.length})</b></span></div> : <span className="insufficient-history">Keine betroffenen Profile</span>}</td>
    <td><div className="overview-changes">{visibleChanges.length ? visibleChanges.map(value => <button data-parameter-key={parameterAnchorKey(value.originalParameterName)} key={value.workingValueId} onClick={event => { event.stopPropagation(); onSelectValue(value); }} type="button"><StatusDot status={value.referenceStatus} /><strong>{value.parameterName}</strong><span><Direction value={value.direction} /> {changeAmount(value)}</span></button>) : <span className="insufficient-history">Keine relevante mathematische Veränderung</span>}{patient.highlights.length > initiallyVisibleChanges ? <button className="show-all-changes" onClick={event => { event.stopPropagation(); onToggleExpanded(patient.id); }} type="button">{expanded ? "Weniger anzeigen" : "Alle Veränderungen anzeigen"}</button> : null}</div></td>
    <td><TrendSummary counts={trends} /></td>
  </tr>;
}

function assessableCount(patient: DashboardPatient) {
  return patient.referenceCounts.below + patient.referenceCounts.within + patient.referenceCounts.above;
}

function formatReportDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function changeAmount(value: DashboardValueDetail) {
  if (value.relativeDifferencePercent !== null) return `${value.relativeDifferencePercent}%`;
  if (value.absoluteDifference !== null) return `Δ ${value.absoluteDifference}${value.unit ? ` ${value.unit}` : ""}`;
  return mathematicalChangeLabel("noComparison");
}

function countDirections(values: DashboardValueDetail[]) {
  return values.reduce<Record<MathematicalDirection, number>>((counts, value) => ({ ...counts, [value.direction]: counts[value.direction] + 1 }), { higher: 0, lower: 0, equal: 0, noComparison: 0 });
}

function TrendSummary({ counts }: { counts: Record<MathematicalDirection, number> }) {
  const comparable = counts.higher + counts.lower + counts.equal;
  if (!comparable) return <span className="insufficient-history">{mathematicalChangeLabel("noComparison")}</span>;
  return <div className="trend-summary">{counts.higher ? <span><ArrowUp size={13} /><b>{counts.higher}</b> {mathematicalChangeLabel("higher")}</span> : null}{counts.lower ? <span><ArrowDown size={13} /><b>{counts.lower}</b> {mathematicalChangeLabel("lower")}</span> : null}{counts.equal ? <span><Minus size={13} /><b>{counts.equal}</b> {mathematicalChangeLabel("equal")}</span> : null}</div>;
}

function StatusDot({ status }: { status: ReferenceStatus }) { return <i aria-hidden="true" className={`reference-dot ${status}`} />; }
function Direction({ value }: { value: DashboardValueDetail["direction"] }) {
  if (value === "higher") return <><ArrowUp size={12} />{mathematicalChangeLabel(value)}</>;
  if (value === "lower") return <><ArrowDown size={12} />{mathematicalChangeLabel(value)}</>;
  if (value === "equal") return <><Minus size={12} />{mathematicalChangeLabel(value)}</>;
  return <>{mathematicalChangeLabel(value)}</>;
}
function DashboardState({ text, error = false, compact = false, action }: { text: string; error?: boolean; compact?: boolean; action?: () => void }) { return <div className={`demo-state ${error ? "error-state" : ""} ${compact ? "compact" : ""}`} role={error ? "alert" : undefined}><strong>{text}</strong>{action ? <button className="outline-button" onClick={action} type="button"><RefreshCw size={14} />Retry</button> : null}</div>; }
function ValueDetail({ value, onClose }: { value: DashboardValueDetail; onClose: () => void }) { return <div className="dashboard-detail-backdrop" role="presentation"><aside aria-label={`${value.parameterName} mathematical detail`} className="dashboard-value-detail" data-demo-target="value-explanation"><button aria-label="Close detail" className="detail-close" onClick={onClose} type="button"><X size={17} /></button><span className="section-kicker">Compact data explanation</span><h2>{value.parameterName}</h2><dl><dt>Current</dt><dd>{value.currentValue} {value.unit}</dd><dt>Previous</dt><dd>{value.previousValue ?? "Not available"} {value.previousValue ? value.unit : ""}</dd><dt>Supplied reference</dt><dd>{value.suppliedReference ?? referenceStatusLabel("notAssessable")}</dd><dt>Reference status</dt><dd><StatusDot status={value.referenceStatus} />{referenceStatusLabel(value.referenceStatus)}</dd><dt>Difference</dt><dd>{value.absoluteDifference ?? mathematicalChangeLabel("noComparison")}{value.relativeDifferencePercent ? ` (${value.relativeDifferencePercent}%)` : ""} · <Direction value={value.direction} /></dd><dt>Report dates</dt><dd>{value.currentReportDate}{value.previousReportDate ? `; previous ${value.previousReportDate}` : ""}</dd><dt>Profiles</dt><dd>{value.profileTags.join(", ") || "No assigned profile"}</dd><dt>Original label</dt><dd>{value.originalParameterName}</dd><dt>Source</dt><dd>{value.originalDocumentName} · {value.provenanceLabel}</dd><dt>Excerpt</dt><dd>{value.provenanceExcerpt ?? "No excerpt stored"}</dd><dt>Rules</dt><dd><code>{value.referenceRuleId}@{value.referenceRuleVersion}</code><br /><code>{value.comparisonRuleId}@{value.comparisonRuleVersion}</code></dd></dl></aside></div>; }
