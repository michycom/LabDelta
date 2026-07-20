import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildSyntheticDocumentPages, parameterAnchorKey } from "../data/syntheticDocument";
import type { ConfirmedReportValue, LaboratoryReport, PatientDetails } from "../types";

export function SyntheticDocumentView({ patient, report, values }: { patient: PatientDetails; report: LaboratoryReport; values: ConfirmedReportValue[] }) {
  const pages = useMemo(() => buildSyntheticDocumentPages(patient, report, values), [patient, report, values]);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => setPageIndex(0), [report.id]);
  const page = pages[pageIndex] ?? pages[0]!;
  const barcodeBars = report.id.replaceAll("-", "").slice(0, 24).split("");

  return <div className="synthetic-document-view" data-demo-target="original-document">
    <aside className="document-page-list" aria-label="Synthetic document pages">
      {pages.map((candidate, index) => <button aria-label={`Open page ${candidate.pageNumber}`} className={index === pageIndex ? "active" : ""} key={candidate.pageNumber} onClick={() => setPageIndex(index)} type="button"><FileText size={22} /><span>Page {candidate.pageNumber}</span></button>)}
    </aside>
    <div className="document-stage">
      <div className="document-navigation"><span>{page.sourceDocument}</span><strong>{page.pageNumber} / {page.pageCount}</strong><button aria-label="Previous Page" disabled={pageIndex === 0} onClick={() => setPageIndex(index => Math.max(0, index - 1))} type="button"><ChevronLeft size={16} /></button><button aria-label="Next Page" disabled={pageIndex === pages.length - 1} onClick={() => setPageIndex(index => Math.min(pages.length - 1, index + 1))} type="button"><ChevronRight size={16} /></button></div>
      <article className="synthetic-document-page" data-demo-target="document-page">
        <header><div><span>SYNTHETIC CONTEST DEMO</span><h2>{page.laboratoryName}</h2><p>Laboratory report · approved synthetic fixture</p></div><div className="barcode" aria-hidden="true">{barcodeBars.map((bar, index) => <i key={`${bar}-${index}`} style={{ width: `${1 + Number.parseInt(bar, 16) % 3}px` }} />)}</div></header>
        <dl><div><dt>Patient</dt><dd>{page.patientName}</dd></div><div><dt>Date of birth</dt><dd>{page.dateOfBirth}</dd></div><div><dt>Report date</dt><dd>{page.reportDate}</dd></div><div><dt>Laboratory ID</dt><dd>{page.reportId}</dd></div></dl>
        <table><thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference interval</th></tr></thead><tbody>{page.rows.map(row => <tr data-parameter-key={parameterAnchorKey(row.parameterName)} data-working-value-id={row.workingValueId} key={row.workingValueId}><td>{row.parameterName}</td><td>{row.result}</td><td>{row.unit}</td><td>{row.reference}</td></tr>)}</tbody></table>
        <div className="document-signature"><span>Released in synthetic fixture</span><i /><small>Demonstration signature field</small></div>
        <footer><span>Source: {page.sourceDocument}</span><strong>Page {page.pageNumber} of {page.pageCount}</strong></footer>
      </article>
      <aside className="document-provenance-panel" data-demo-target="provenance-panel"><strong>Stable source links</strong><p>{page.rows.length} displayed rows retain their confirmed working-value IDs and stored provenance locators.</p>{page.rows[0] ? <small>{page.rows[0].parameterName} · {page.rows[0].provenance}</small> : null}</aside>
    </div>
  </div>;
}
