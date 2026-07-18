import { CheckCircle2, FileUp, LockKeyhole } from "lucide-react";
import { Panel } from "./Panel";

export function ImportPanel() {
  return <Panel number={6} title="Import dialog" className="import-panel"><div className="import-steps"><b>① File</b><span>② Assignment</span><span>③ Review</span><span>④ Import</span></div><small>Selected patient (manually)</small><div className="selected-patient"><div className="avatar">AM</div><span><strong>Müller, Anna</strong><small>12.03.1985 · ID: P-10023</small></span><CheckCircle2 /></div><div className="safety-check"><strong>Automatic safety check</strong><span>✓ Patient name in file: Müller, Anna</span><span>✓ Date of birth matches: 12.03.1985</span><span>✓ ID matches: P-10023</span></div><button className="drop-zone" type="button"><FileUp /><span>Drop file here or</span><strong>Choose file</strong></button><small>Supported formats: PDF, CSV, JSON, TXT</small><div className="actions"><button type="button">Cancel</button><button className="primary" type="button">Next</button></div><p><LockKeyhole size={14} /> Import is only possible for the selected patient.</p></Panel>;
}

