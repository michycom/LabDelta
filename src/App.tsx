import { useState } from "react";
import { DemoDataWorkspace } from "./components/DemoDataWorkspace";
import { DashboardOverview } from "./components/DashboardOverview";
import { DemoDisclaimer } from "./components/DemoDisclaimer";
import { Header } from "./components/Header";
import { PatientManagement } from "./components/PatientManagement";
import { Shell } from "./components/Shell";
import { useDemoData } from "./hooks/useDemoData";
import { hasAcknowledgedDemoDisclaimer, storeDemoDisclaimerAcknowledgement } from "./state/demoAcknowledgement";
import type { AppSection } from "./types";

export default function App() {
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(hasAcknowledgedDemoDisclaimer);

  if (!hasAcknowledgedDisclaimer) {
    return <DemoDisclaimer onAcknowledge={() => {
      storeDemoDisclaimerAcknowledgement();
      setHasAcknowledgedDisclaimer(true);
    }} />;
  }

  return <LabDeltaApplication />;
}

function LabDeltaApplication() {
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const demoData = useDemoData();
  return <Shell activeSection={activeSection} onNavigate={setActiveSection}>
    <Header
      patient={demoData.selectedPatient}
      referenceSources={demoData.referenceSources}
      selectedReferenceSource={demoData.selectedReferenceSource}
      referenceCatalogParameters={demoData.referenceCatalogParameters}
      referenceSourcesError={demoData.referenceSourcesError}
      onOpenPatients={() => setActiveSection("patients")}
      onSelectReferenceSource={demoData.selectReferenceSource}
    />
    {activeSection === "dashboard" ? <DashboardOverview onOpenPatient={patientId => {
      demoData.selectPatient(patientId);
      setActiveSection("reports");
    }} /> : activeSection === "reports" ? <DemoDataWorkspace
      patients={demoData.patients}
      selectedPatient={demoData.selectedPatient}
      patientDetails={demoData.patientDetails}
      reports={demoData.reports}
      selectedReport={demoData.selectedReport}
      values={demoData.values}
      isLoadingPatients={demoData.isLoadingPatients}
      isLoadingPatientData={demoData.isLoadingPatientData}
      isLoadingValues={demoData.isLoadingValues}
      patientsError={demoData.patientsError}
      patientDataError={demoData.patientDataError}
      valuesError={demoData.valuesError}
      onRefreshPatients={demoData.refreshPatients}
      onSelectPatient={demoData.selectPatient}
      onSelectReport={demoData.selectReport}
    /> : activeSection === "patients" ? <PatientManagement
      patients={demoData.patients}
      selectedPatientId={demoData.selectedPatientId}
      isLoading={demoData.isLoadingPatients}
      error={demoData.patientsError}
      onRefresh={demoData.refreshPatients}
      onSelect={patientId => {
        demoData.selectPatient(patientId);
        setActiveSection("reports");
      }}
    /> : <InformationView section={activeSection} />}
    <footer><strong>Research and demonstration project.</strong> Not clinically validated and not released for medical use. No diagnosis, prognosis, treatment, test, or therapy recommendation. Synthetic source documents remain authoritative for this demonstration.</footer>
  </Shell>;
}

function InformationView({ section }: { section: "provenance" | "import" }) {
  if (section === "import") return <section className="information-view"><span className="section-kicker">Contest Demo limitation</span><h1>Import</h1><p>Manual import is disabled in the Contest Demo. LabDelta uses only approved synthetic fixtures.</p><p>No file dialog, drag-and-drop, parser, or write operation is available.</p></section>;
  return <section className="information-view"><span className="section-kicker">Stored source metadata</span><h1>Provenance</h1><p>Open a patient report to inspect its approved synthetic source document, original label, locator, and excerpt.</p><button className="outline-button" type="button">Read-only synthetic provenance</button></section>;
}
