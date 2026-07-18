import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { results } from "../data/demo";
import { Panel } from "./Panel";

export function PatientWorkspace() {
  return <Panel number={2} title="Patient detail & comparison" className="workspace">
    <div className="patient-heading"><div className="avatar">AM</div><div><h3>Müller, Anna</h3><span>12.03.1985 (40 y.) · ID: P-10023</span></div><button type="button">Edit patient</button></div>
    <div className="tabs"><button type="button">Overview</button><button type="button">Laboratory reports</button><button className="active" type="button">Comparisons</button><button type="button">Laboratory profiles</button><button type="button">History</button><button type="button">Notes</button></div>
    <div className="comparison-bar"><strong>Comparison: 05.04.2025 ↔ 12.05.2025 (37 days)</strong><label>Laboratory profile: <select aria-label="Laboratory profile"><option>All profiles</option></select></label></div>
    <div className="table-wrap"><table><thead><tr><th>Parameter</th><th>Previous<br /><small>05.04.2025</small></th><th>Current<br /><small>12.05.2025</small></th><th>Reference interval</th><th>Position</th><th>Change</th><th>Long-term trend</th><th>Trend since</th></tr></thead>
      <tbody>{results.map(result => <tr key={result.parameter}><td><span className={`dot ${result.severity}`} /><strong>{result.parameter}</strong></td><td>{result.previous}</td><td>{result.current}</td><td>{result.reference}</td><td>{result.position}</td><td className={result.direction}>{result.direction === "risen" ? <ArrowUp /> : result.direction === "fallen" ? <ArrowDown /> : <ArrowRight />}<strong>{result.delta}</strong></td><td>{result.tendency}</td><td>{result.history}</td></tr>)}</tbody></table></div>
    <button className="outline-button" type="button">Show all parameters (34)</button>
  </Panel>;
}

