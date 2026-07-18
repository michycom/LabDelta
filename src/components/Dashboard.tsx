import { ArrowDown, ArrowRight, ArrowUp, Info } from "lucide-react";
import { patients } from "../data/demo";
import type { Direction } from "../types";
import { Panel } from "./Panel";

const TrendIcon = ({ direction }: { direction: Direction }) => direction === "risen" ? <ArrowUp /> : direction === "fallen" ? <ArrowDown /> : <ArrowRight />;

export function Dashboard({ onSelectPatient }: { onSelectPatient: () => void }) {
  return <Panel number={1} title="Dashboard — notable changes" subtitle="Overview across all patients" className="dashboard">
    <div className="filters"><button className="selected" type="button">All (6)</button><button type="button">● Attention (4)</button><button type="button">◆ Markedly changed (2)</button><button type="button">↝ With long-term trend (3)</button></div>
    <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Latest report</th><th>Notable / markedly changed values</th><th>Affected profiles</th><th>Top changes</th><th>Trend summary</th></tr></thead>
      <tbody>{patients.map((patient, index) => <tr key={patient.id} className={index === 0 ? "highlight" : ""} onClick={index === 0 ? onSelectPatient : undefined}>
        <td><span className={`dot ${patient.severity}`} /> <strong>{patient.name}</strong></td><td>{patient.latestReport}</td><td>{patient.flagged}</td><td><div className="profile-list">{patient.profiles.join(", ")}</div></td>
        <td>{patient.changes.map(change => <div className={`change ${change.direction}`} key={change.parameter}><span>{change.parameter}</span><TrendIcon direction={change.direction} /><strong>{change.delta}</strong></div>)}</td>
        <td><span className="risen">↑ 3</span> <span className="fallen">↓ 2</span> → 1</td>
      </tr>)}</tbody></table></div>
    <div className="legend"><span><i className="dot normal" />Normal</span><span><i className="dot slight" />Slight attention</span><span><i className="dot attention" />Attention</span><span><i className="dot marked" />Markedly changed</span><button type="button">Show all patients</button></div>
    <p className="info"><Info size={15} /> A laboratory value can belong to several laboratory profiles. Profile counts may therefore overlap.</p>
  </Panel>;
}

