import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Header } from "./components/Header";
import { ImportPanel } from "./components/ImportPanel";
import { PatientWorkspace } from "./components/PatientWorkspace";
import { ProfileOverview } from "./components/ProfileOverview";
import { Shell } from "./components/Shell";
import { SourcePreview } from "./components/SourcePreview";
import { TrendPanel } from "./components/TrendPanel";
import { PatientManagement } from "./components/PatientManagement";
import { usePatients } from "./hooks/usePatients";
import type { AppSection } from "./types";

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const patientState = usePatients();
  return <Shell activeSection={activeSection} onNavigate={setActiveSection}><Header patient={patientState.selectedPatient} onOpenPatients={() => setActiveSection("patients")} />{activeSection === "dashboard" ? <div className="workspace-grid"><Dashboard onSelectPatient={() => setActiveSection("patients")} /><PatientWorkspace /><ProfileOverview /><TrendPanel /><SourcePreview /><ImportPanel /></div> : <PatientManagement patients={patientState.patients} selectedPatientId={patientState.selectedPatientId} isLoading={patientState.isLoading} error={patientState.error} onRefresh={patientState.refresh} onSelect={patientState.selectPatient} onCreate={patientState.createPatient} onUpdate={patientState.updatePatient} onDelete={patientState.deletePatient} />}<footer><strong>Research and demonstration prototype.</strong> Not clinically validated or certified as a medical device. No diagnosis or recommendations. Patient identities are stored locally; Stage 1 laboratory displays remain static synthetic demonstration data.</footer></Shell>;
}
