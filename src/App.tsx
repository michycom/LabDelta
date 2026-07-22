import { useEffect, useState } from "react";
import { sectionForMenuAction, subscribeNativeMenu, updateNativeMenu } from "./api/nativeMenu";
import { DemoDataWorkspace } from "./components/DemoDataWorkspace";
import { DashboardOverview } from "./components/DashboardOverview";
import { DemoDisclaimer } from "./components/DemoDisclaimer";
import { DemoWalkthroughControls } from "./components/DemoWalkthroughControls";
import { DemoIntroScreen } from "./components/DemoIntroScreen";
import { Header } from "./components/Header";
import { PatientManagement } from "./components/PatientManagement";
import { ImportInformationView } from "./components/ImportInformationView";
import { Shell } from "./components/Shell";
import { useDemoData } from "./hooks/useDemoData";
import { useDemoWalkthrough } from "./demo/useDemoWalkthrough";
import { hasAcknowledgedDemoDisclaimer, storeDemoDisclaimerAcknowledgement } from "./state/demoAcknowledgement";
import type { AppSection, PatientListItem } from "./types";
import { I18nProvider, useI18n, type UiLanguage } from "./i18n";

export default function App() {
  return <I18nProvider><AppContent /></I18nProvider>;
}

function AppContent() {
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

export function LabDeltaApplication({ nativeAction }: { nativeAction: { id: string; sequence: number } | null }) {
  const { language, setLanguage, t } = useI18n();
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [demoVisible, setDemoVisible] = useState(true);
  const demoData = useDemoData();
  const walkthrough = useDemoWalkthrough();
  const demoPatients = demoData.patients;
  const selectDemoPatient = demoData.selectPatient;

  useEffect(() => { if (walkthrough.state.language !== language) walkthrough.setLanguage(language); }, [language, walkthrough]);
  useEffect(() => { void updateNativeMenu(language, demoVisible); }, [demoVisible, language]);

  useEffect(() => {
    setActiveSection(walkthrough.step.section);
    if (walkthrough.step.clearPatientSelection) {
      selectDemoPatient(null);
    } else if (walkthrough.step.patientName) {
      const patient = demoPatients.find(candidate => candidate.displayName === walkthrough.step.patientName);
      if (patient) selectDemoPatient(patient.id);
    }
  // A chapter selection applies its visual state once. Normal user navigation
  // remains available afterwards and must not be overwritten by data refreshes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkthrough.step.id]);

  useEffect(() => {
    const targetBySection: Partial<Record<AppSection, string>> = {
      profiles: "profile-overview",
      history: "parameter-history",
      originalDocument: "original-document",
      provenance: "provenance"
    };
    const target = targetBySection[activeSection];
    if (!target) return;
    const timer = window.setTimeout(() => document.querySelector<HTMLElement>(`[data-demo-target="${target}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
    return () => window.clearTimeout(timer);
  }, [activeSection, demoData.selectedReportId]);

  useEffect(() => {
    if (!nativeAction) return;
    const section = sectionForMenuAction(nativeAction.id);
    if (section) setActiveSection(section);
    if (nativeAction.id === "close-patient") {
      demoData.selectPatient(null);
      setActiveSection("dashboard");
    }
    if (nativeAction.id === "toggle-sidebar") setSidebarVisible(visible => !visible);
    if (nativeAction.id === "toggle-demo-visibility") setDemoVisible(visible => !visible);
    if (nativeAction.id === "settings") setActiveSection("preferences");
    if (nativeAction.id === "demo-play") walkthrough.play();
    if (nativeAction.id === "demo-contest") walkthrough.startMode("contest");
    if (nativeAction.id === "demo-full") walkthrough.startMode("full");
    if (nativeAction.id === "demo-pause") walkthrough.pause();
    if (nativeAction.id === "demo-stop") walkthrough.stop();
    if (nativeAction.id === "demo-restart") walkthrough.restart();
    if (nativeAction.id === "demo-previous-step") walkthrough.previous();
    if (nativeAction.id === "demo-next-step") walkthrough.next();
    if (nativeAction.id === "language-english") setLanguage("en");
    if (nativeAction.id === "language-german") setLanguage("de");
    if (nativeAction.id === "language-chinese") setLanguage("zh-CN");
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
    {activeSection === "dashboard" || activeSection === "analysis" ? <DashboardOverview language={walkthrough.state.language} mode={activeSection === "analysis" ? "analysis" : "patients"} selectedPatientId={demoData.selectedPatientId} revealValueDetailForPatient={walkthrough.step.revealValueDetail && (walkthrough.state.playback === "playing" || walkthrough.state.playback === "paused") ? walkthrough.step.patientName ?? null : null} onOpenPatient={patientId => {
      demoData.selectPatient(patientId);
      setActiveSection("reports");
    }} /> : ["reports", "profiles", "history", "originalDocument", "provenance"].includes(activeSection) ? <DemoDataWorkspace
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
    /> : <InformationView patient={demoData.selectedPatient} section={activeSection as Exclude<AppSection, "dashboard" | "analysis" | "patients" | "reports" | "profiles" | "history" | "originalDocument" | "provenance">} />}
    <footer><strong>{t("footerStrong")}</strong> {t("footerText")}</footer>
    {demoVisible ? <DemoWalkthroughControls
      language={walkthrough.state.language}
      autoplay={walkthrough.state.autoplay}
      elapsedMs={walkthrough.elapsedMs}
      onLanguage={setLanguage}
      onPause={walkthrough.pause}
      onPlay={walkthrough.play}
      onReplay={walkthrough.restart}
      onPrevious={walkthrough.previous}
      onNext={walkthrough.next}
      onStop={walkthrough.stop}
      onAutoplay={walkthrough.setAutoplay}
      playback={walkthrough.state.playback}
      step={walkthrough.step}
      stepCount={walkthrough.stepCount}
      stepIndex={walkthrough.state.stepIndex}
    /> : null}
    {(["preparing", "playing", "paused"] as const).includes(walkthrough.state.playback as "preparing" | "playing" | "paused") && walkthrough.step.id === "introduction" ? <DemoIntroScreen durationMs={walkthrough.step.durationMs} language={walkthrough.state.language} paused={walkthrough.state.playback === "paused"} /> : null}
  </Shell>;
}

function InformationView({ section, patient }: { section: Exclude<AppSection, "dashboard" | "analysis" | "patients" | "reports" | "profiles" | "history" | "originalDocument" | "provenance">; patient: PatientListItem | null }) {
  const { language, setLanguage, t } = useI18n();
  if (section === "import") return <ImportInformationView patient={patient} />;
  if (section === "preferences") return <section className="information-view preferences-view"><span className="section-kicker">LabDelta</span><h1>{t("preferences")}</h1><label>{t("interfaceLanguage")}<select aria-label={t("interfaceLanguage")} onChange={event => setLanguage(event.target.value as UiLanguage)} value={language}><option value="en">English</option><option value="de">Deutsch</option><option value="zh-CN">中文（简体）</option></select></label><p>{t("languageHelp")}</p></section>;
  if (section === "about") return <section className="information-view"><h1>{t("about")}</h1><p>{t("aboutBody")}</p></section>;
  if (section === "limitations") return <DevelopmentStatusView />;
  if (section === "documentation") return <section className="information-view"><h1>{t("documentation")}</h1><p>{t("documentationBody")}</p></section>;
  if (section === "fixtures") return <section className="information-view"><h1>{t("fixtures")}</h1><p>{t("fixturesBody")}</p></section>;
  return null;
}

function DevelopmentStatusView() {
  const { t } = useI18n();
  return <section className="information-view development-status-view" data-demo-target="development-status">
    <span className="section-kicker">{t("developmentStatusKicker")}</span>
    <h1>{t("developmentStatusTitle")}</h1>
    <p className="development-status-intro">{t("developmentStatusIntro")}</p>
    <div className="development-status-grid">
      <article><h2>{t("demonstrableNow")}</h2><p>{t("demonstrableNowBody")}</p></article>
      <article><h2>{t("notValidated")}</h2><p>{t("notValidatedBody")}</p></article>
      <article><h2>{t("collaborationNeeded")}</h2><p>{t("collaborationNeededBody")}</p></article>
      <article><h2>{t("syntheticDemoOnly")}</h2><p>{t("syntheticDemoOnlyBody")}</p></article>
    </div>
  </section>;
}
