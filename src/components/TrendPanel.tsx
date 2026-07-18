import { Panel } from "./Panel";

const points = "0,12 45,32 88,40 132,62 176,74 220,85 264,112 300,90 336,125";

export function TrendPanel() {
  return <Panel number={4} title="Parameter history" subtitle="Example: Ferritin" className="trend-panel"><div className="trend-content"><div className="chart"><strong>Ferritin (µg/l)</strong><div className="range-buttons"><button type="button">1M</button><button type="button">3M</button><button type="button">6M</button><button className="selected" type="button">1Y</button><button type="button">All</button></div><svg viewBox="0 0 360 150" role="img" aria-label="Ferritin values falling over one year"><rect x="0" y="35" width="360" height="95" className="reference-area" /><polyline points={points} /><g>{points.split(" ").map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="4" />; })}</g></svg><div className="axis"><span>May 24</span><span>Aug 24</span><span>Nov 24</span><span>Feb 25</span><span>May 25</span></div></div><aside><small>Current value</small><strong>65 µg/l</strong><small>Reference interval</small><span>30–300 µg/l</span><small>Position</small><b>● lower third</b><small>Change</small><strong className="fallen">↓ −45%</strong><small>Long-term trend</small><strong className="fallen">↘ falling</strong></aside></div></Panel>;
}

