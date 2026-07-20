import { useState } from "react";
import { DemoDataWorkspace } from "./components/DemoDataWorkspace";
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
    {activeSection === "dashboard" ? <DemoDataWorkspace
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
    /> : <PatientManagement
      patients={demoData.patients}
      selectedPatientId={demoData.selectedPatientId}
      isLoading={demoData.isLoadingPatients}
      error={demoData.patientsError}
      onRefresh={demoData.refreshPatients}
      onSelect={patientId => {
        demoData.selectPatient(patientId);
        setActiveSection("dashboard");
      }}
    />}
    <footer><strong>Research and demonstration project.</strong> Not clinically validated and not released for medical use. No diagnosis, prognosis, treatment, test, or therapy recommendation. Synthetic source documents remain authoritative for this demonstration.</footer>
  </Shell>;
}
