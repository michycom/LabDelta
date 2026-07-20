import { useEffect, useState } from "react";
import { sectionForMenuAction, subscribeNativeMenu } from "./api/nativeMenu";
import { DemoDataWorkspace } from "./components/DemoDataWorkspace";
import { DashboardOverview } from "./components/DashboardOverview";
import { DemoDisclaimer } from "./components/DemoDisclaimer";
import { DemoWalkthroughControls } from "./components/DemoWalkthroughControls";
import { Header } from "./components/Header";
import { PatientManagement } from "./components/PatientManagement";
import { Shell } from "./components/Shell";
import { useDemoData } from "./hooks/useDemoData";
import { useDemoWalkthrough } from "./demo/useDemoWalkthrough";
import { hasAcknowledgedDemoDisclaimer, storeDemoDisclaimerAcknowledgement } from "./state/demoAcknowledgement";
import type { AppSection } from "./types";

export default function App() {
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(hasAcknowledgedDemoDisclaimer);
  const [nativeAction, setNativeAction] = useState<{ id: string; sequence: number } | null>(null);

  useEffect(() => {
    let unlisten: () => void = () => undefined;
    void subscribeNativeMenu(id => {
      if (id === "show-disclaimer") setHasAcknowledgedDisclaimer(false);
      else setNativeAction(current => ({ id, sequence: (current?.sequence ?? 0) + 1 }));
    }).then(callback => { unlisten = callback; });
    return () => unlisten();
  }, []);

  if (!hasAcknowledgedDisclaimer) {
    return <DemoDisclaimer onAcknowledge={() => {
      storeDemoDisclaimerAcknowledgement();
      setHasAcknowledgedDisclaimer(true);
    }} />;
  }

  return <LabDeltaApplication nativeAction={nativeAction} />;
}

function LabDeltaApplication({ nativeAction }: { nativeAction: { id: string; sequence: number } | null }) {
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const demoData = useDemoData();
  const walkthrough = useDemoWalkthrough();
  const demoPatients = demoData.patients;
  const selectedDemoPatientId = demoData.selectedPatientId;
  const selectDemoPatient = demoData.selectPatient;

  useEffect(() => {
    if (walkthrough.state.playback !== "playing" && walkthrough.state.playback !== "paused") return;
    setActiveSection(walkthrough.step.section);
    if (walkthrough.step.patientName) {
      const patient = demoPatients.find(candidate => candidate.displayName === walkthrough.step.patientName);
      if (patient && patient.id !== selectedDemoPatientId) selectDemoPatient(patient.id);
    }
  }, [demoPatients, selectDemoPatient, selectedDemoPatientId, walkthrough.state.playback, walkthrough.step]);

  useEffect(() => {
    if (!nativeAction) return;
    const section = sectionForMenuAction(nativeAction.id);
    if (section) setActiveSection(section);
    if (nativeAction.id === "close-patient") {
      demoData.selectPatient(null);
      setActiveSection("dashboard");
    }
    if (nativeAction.id === "toggle-sidebar") setSidebarVisible(visible => !visible);
    if (nativeAction.id === "demo-play") walkthrough.play();
    if (nativeAction.id === "demo-pause") walkthrough.pause();
    if (nativeAction.id === "demo-stop") walkthrough.stop();
    if (nativeAction.id === "demo-restart") walkthrough.restart();
    if (nativeAction.id === "demo-previous-step") walkthrough.previous();
    if (nativeAction.id === "demo-next-step") walkthrough.next();
    if (nativeAction.id === "language-english") walkthrough.setLanguage("en");
    if (nativeAction.id === "language-german") walkthrough.setLanguage("de");
    if (nativeAction.id === "next-patient" || nativeAction.id === "previous-patient") {
      const current = demoData.patients.findIndex(patient => patient.id === demoData.selectedPatientId);
      const offset = nativeAction.id === "next-patient" ? 1 : -1;
      const target = demoData.patients[(current + offset + demoData.patients.length) % demoData.patients.length];
      if (target) { demoData.selectPatient(target.id); setActiveSection("reports"); }
    }
    if (nativeAction.id === "next-report" || nativeAction.id === "previous-report") {
      const current = demoData.reports.findIndex(report => report.id === demoData.selectedReportId);
      const offset = nativeAction.id === "next-report" ? 1 : -1;
      const target = demoData.reports[(current + offset + demoData.reports.length) % demoData.reports.length];
      if (target) { demoData.selectReport(target.id); setActiveSection("reports"); }
    }
  // Menu sequence intentionally drives this effect once per native selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeAction]);

  return <Shell activeSection={activeSection} onNavigate={setActiveSection} sidebarVisible={sidebarVisible}>
    <Header
      patient={demoData.selectedPatient}
      referenceSources={demoData.referenceSources}
      selectedReferenceSource={demoData.selectedReferenceSource}
      referenceCatalogParameters={demoData.referenceCatalogParameters}
      referenceSourcesError={demoData.referenceSourcesError}
      onOpenPatients={() => setActiveSection("patients")}
      onSelectReferenceSource={demoData.selectReferenceSource}
    />
    {activeSection === "dashboard" ? <DashboardOverview revealValueDetailForPatient={walkthrough.step.revealValueDetail && (walkthrough.state.playback === "playing" || walkthrough.state.playback === "paused") ? walkthrough.step.patientName ?? null : null} onOpenPatient={patientId => {
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
    <DemoWalkthroughControls
      language={walkthrough.state.language}
      onLanguage={walkthrough.setLanguage}
      onPause={walkthrough.pause}
      onPlay={walkthrough.play}
      onRestart={walkthrough.restart}
      onPrevious={walkthrough.previous}
      onNext={walkthrough.next}
      onStop={walkthrough.stop}
      playback={walkthrough.state.playback}
      step={walkthrough.step}
      stepCount={walkthrough.stepCount}
      stepIndex={walkthrough.state.stepIndex}
    />
  </Shell>;
}

function InformationView({ section }: { section: Exclude<AppSection, "dashboard" | "patients" | "reports"> }) {
  if (section === "import") return <section className="information-view" data-demo-target="import-boundary"><span className="section-kicker">Contest Demo limitation</span><h1>Import</h1><p>Manual import is disabled in the Contest Demo. LabDelta uses only approved synthetic fixtures.</p><p>No file dialog, drag-and-drop, parser, or write operation is available.</p></section>;
  if (section === "about") return <section className="information-view"><span className="section-kicker">LabDelta Contest Demo</span><h1>About LabDelta</h1><p>Local-first research and demonstration software using only approved synthetic fixtures.</p></section>;
  if (section === "limitations") return <section className="information-view"><span className="section-kicker">Demo Data and Limitations</span><h1>Contest Demo limitations</h1><p>No clinical validation, medical interpretation, diagnosis, therapy, general import, cloud, telemetry, or runtime AI.</p></section>;
  if (section === "documentation") return <section className="information-view"><span className="section-kicker">Local documentation</span><h1>Project Documentation</h1><p>The binding project, acceptance, reference catalog, and fixture documentation is stored locally in the docs directory.</p></section>;
  if (section === "fixtures") return <section className="information-view"><span className="section-kicker">Approved local data</span><h1>About Synthetic Fixtures</h1><p>Eva Mittel, Dirk Mayer, and Daniel Power are fully synthetic, deterministic Contest Demo patients.</p></section>;
  return <section className="information-view"><span className="section-kicker">Stored source metadata</span><h1>Provenance</h1><p>Open a patient report to inspect its approved synthetic source document, original label, locator, and excerpt.</p><button className="outline-button" type="button">Read-only synthetic provenance</button></section>;
}
