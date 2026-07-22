import { ChevronDown, Database, LockKeyhole } from "lucide-react";
import { useI18n } from "../i18n";
import type { PatientListItem, ReferenceCatalogParameter, ReferenceSource } from "../types";

export function Header({ patient, referenceSources, selectedReferenceSource, referenceCatalogParameters, referenceSourcesError, onOpenPatients, onSelectReferenceSource }: { patient: PatientListItem | null; referenceSources: ReferenceSource[]; selectedReferenceSource: ReferenceSource | null; referenceCatalogParameters: ReferenceCatalogParameter[]; referenceSourcesError: string | null; onOpenPatients: () => void; onSelectReferenceSource: (sourceId: string) => void; }) {
  const { t } = useI18n();
  return <header className="topbar">
    <button aria-label={patient ? `${t("selected")} ${patient.displayName} ${patient.id}` : t("choosePatient")} className="patient-picker" type="button" onClick={onOpenPatients}><span><strong>{patient ? patient.displayName : t("noPatient")}</strong><small>{patient ? `${patient.dateOfBirth} · ID: ${patient.id}` : t("chooseSeeded")}</small></span><ChevronDown size={18} /></button>
    <div className="reference-source-picker"><label htmlFor="reference-source">{t("referenceSource")}</label><select id="reference-source" value={selectedReferenceSource?.id ?? ""} onChange={event => onSelectReferenceSource(event.target.value)} disabled={referenceSources.length === 0}>{referenceSources.map(source => <option disabled={source.availability === "futureDisabled"} key={`${source.id}-${source.version}`} value={source.id}>{source.displayName}{source.availability === "futureDisabled" ? ` (${t("futureDisabled")})` : ""}</option>)}</select>{referenceSourcesError ? <small role="alert">{referenceSourcesError}</small> : selectedReferenceSource ? <small>{selectedReferenceSource.sourceNotice}{selectedReferenceSource.demonstrationOnly ? ` ${referenceCatalogParameters.length} ${t("syntheticAvailable")}` : ""}</small> : <small>{t("loadingReferences")}</small>}</div>
    <div className="data-status"><Database size={17} /> <strong>{t("localSqlite")}</strong></div><div className="data-status"><LockKeyhole size={17} /> <strong>{t("readOnly")}</strong></div>
  </header>;
}
