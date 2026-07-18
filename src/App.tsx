import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Header } from "./components/Header";
import { ImportPanel } from "./components/ImportPanel";
import { PatientWorkspace } from "./components/PatientWorkspace";
import { ProfileOverview } from "./components/ProfileOverview";
import { Shell } from "./components/Shell";
import { SourcePreview } from "./components/SourcePreview";
import { TrendPanel } from "./components/TrendPanel";

export default function App() {
  const [patientSelected, setPatientSelected] = useState(false);
  return <Shell><Header patientSelected={patientSelected} onToggle={() => setPatientSelected(value => !value)} /><div className="workspace-grid"><Dashboard onSelectPatient={() => setPatientSelected(true)} /><PatientWorkspace /><ProfileOverview /><TrendPanel /><SourcePreview /><ImportPanel /></div><footer><strong>Research and demonstration prototype.</strong> Not clinically validated or certified as a medical device. No diagnosis or recommendations. All displayed information is static synthetic demonstration data.</footer></Shell>;
}

