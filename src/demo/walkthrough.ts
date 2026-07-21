import type { AppSection } from "../types";

export type DemoLanguage = "en" | "de";

export interface DemoStep {
  id: string;
  chapter: number;
  section: AppSection;
  target: string;
  patientName?: "Dirk Mayer";
  revealValueDetail?: boolean;
  durationMs: number;
  subtitle: Record<DemoLanguage, string>;
}

const step = (id: string, chapter: number, section: AppSection, target: string, en: string, de: string, options: Pick<DemoStep, "patientName" | "revealValueDetail"> = {}): DemoStep => ({ id, chapter, section, target, durationMs: 7000, subtitle: { en, de }, ...options });

export const DEMO_STEPS: readonly DemoStep[] = [
  { ...step("introduction", 1, "dashboard", "demo-banner", "Laboratory data is often distributed across multiple reports and isolated points in time. LabDelta organizes longitudinal laboratory information transparently, compares it mathematically, and traces it to its original source.", "Laborwerte liegen häufig über mehrere Berichte und einzelne Zeitpunkte verteilt vor. LabDelta organisiert longitudinale Laborinformationen transparent, vergleicht sie mathematisch und führt sie auf ihre Originalquelle zurück."), durationMs: 15000 },

  step("dashboard", 2, "dashboard", "dashboard-overview", "The dashboard is the compact starting point for all three approved synthetic patients.", "Das Dashboard ist der kompakte Ausgangspunkt für alle drei freigegebenen synthetischen Personen."),
  step("dashboard-patients", 2, "dashboard", "dashboard-patient-table", "Each row brings the latest report, comparable values, affected profiles, individual changes, and longitudinal directions together.", "Jede Zeile führt den neuesten Bericht, vergleichbare Werte, betroffene Profile, Einzelveränderungen und Verlaufsrichtungen zusammen."),
  step("dashboard-filters", 2, "dashboard", "dashboard-filters", "These filters use only deterministic properties already calculated from report references and comparable measurements.", "Diese Filter verwenden ausschließlich deterministische Eigenschaften aus Berichtsreferenzen und vergleichbaren Messungen."),
  step("dashboard-values", 2, "dashboard", "dashboard-values-column", "This count combines values outside the supplied report reference with clearly changed, comparable values. It is a data summary, not a medical score.", "Diese Anzahl verbindet Werte außerhalb der gelieferten Berichtsreferenz mit deutlich veränderten, vergleichbaren Werten. Sie ist eine Datenübersicht, keine medizinische Bewertung."),
  step("dashboard-profiles", 2, "dashboard", "dashboard-profiles-column", "Only versioned profiles touched by those displayed parameters appear here. Profiles are organizational groups, not diagnoses.", "Hier erscheinen nur versionierte Profile, die von den dargestellten Parametern betroffen sind. Profile sind organisatorische Gruppen, keine Diagnosen."),
  step("dashboard-changes", 2, "dashboard", "dashboard-changes-column", "The most important changes show parameter, mathematical direction, and available relative or absolute difference. Every remaining change can be expanded.", "Die wichtigsten Veränderungen zeigen Parameter, mathematische Richtung und die verfügbare relative oder absolute Differenz. Alle weiteren Veränderungen lassen sich aufklappen."),
  step("dashboard-trends", 2, "dashboard", "dashboard-trends-column", "The trend summary counts rising, falling, stable, or non-comparable directions without prediction or interpretation. Let's inspect one patient in more detail.", "Die Trend-Zusammenfassung zählt steigende, fallende, stabile oder nicht vergleichbare Richtungen ohne Prognose oder Interpretation. Sehen wir uns eine Person genauer an."),

  step("patient-selection", 3, "dashboard", "patient-dirk-mayer", "Dirk Mayer is selected deterministically because this synthetic fixture has three reports, four profiles, comparable history, explainable data, and provenance.", "Dirk Mayer wird deterministisch ausgewählt, weil dieses synthetische Fixture drei Berichte, vier Profile, vergleichbare Historie, erklärbare Daten und Provenienz besitzt.", { patientName: "Dirk Mayer" }),

  step("analysis-overview", 4, "analysis", "analysis-dashboard", "Analysis Overview reuses the detailed dashboard blocks and leads into the compact data explanation for the selected synthetic patient.", "Die Analysis Overview verwendet die ausführlichen Dashboard-Blöcke wieder und führt zur kompakten Datenerklärung für die ausgewählte synthetische Person.", { patientName: "Dirk Mayer" }),
  step("analysis-current", 4, "analysis", "analysis-current", "Current is the explicitly confirmed working value from the latest report.", "Current ist der ausdrücklich bestätigte Arbeitswert aus dem neuesten Bericht.", { patientName: "Dirk Mayer", revealValueDetail: true }),
  step("analysis-previous", 4, "analysis", "analysis-previous", "Previous is included only when the same parameter and unit are unambiguously comparable.", "Previous wird nur einbezogen, wenn derselbe Parameter und dieselbe Einheit eindeutig vergleichbar sind.", { patientName: "Dirk Mayer", revealValueDetail: true }),
  step("analysis-reference", 4, "analysis", "analysis-reference", "Supplied reference is read from this synthetic report and remains the default reference source.", "Supplied reference stammt aus diesem synthetischen Bericht und bleibt die Standard-Referenzquelle.", { patientName: "Dirk Mayer", revealValueDetail: true }),
  step("analysis-change", 4, "analysis", "analysis-change", "The arithmetic difference and direction explain why the value is shown. They do not express improvement, deterioration, or risk.", "Die mathematische Differenz und Richtung erklären, warum der Wert gezeigt wird. Sie drücken weder Verbesserung, Verschlechterung noch Risiko aus.", { patientName: "Dirk Mayer", revealValueDetail: true }),

  step("patient-detail", 5, "reports", "patient-detail", "Patient Detail keeps the report comparison, confirmed parameters, and the transparent reason for displaying each value together.", "Patient Detail führt den Berichtsvergleich, bestätigte Parameter und den transparenten Grund für die Anzeige jedes Werts zusammen.", { patientName: "Dirk Mayer" }),
  step("comparison", 5, "reports", "confirmed-values", "The comparison retains original labels, units, supplied references, and exact source links. No values are silently converted.", "Der Vergleich bewahrt Originalbezeichnungen, Einheiten, gelieferte Referenzen und genaue Quellenlinks. Werte werden nicht still umgerechnet.", { patientName: "Dirk Mayer" }),

  step("profiles", 6, "profiles", "assigned-profiles", "Small Blood Count, Kidney Profile, Lipid Profile, and Glucose Metabolism are static versioned organizational groups, never diagnoses or scores.", "Small Blood Count, Kidney Profile, Lipid Profile und Glucose Metabolism sind statische versionierte Organisationsgruppen, niemals Diagnosen oder Bewertungen.", { patientName: "Dirk Mayer" }),
  step("history", 7, "history", "parameter-history", "Three dated reports provide parameter history. The application shows deterministic comparisons and makes no forecast.", "Drei datierte Berichte bilden den Parameterverlauf. Die Anwendung zeigt deterministische Vergleiche und erstellt keine Prognose.", { patientName: "Dirk Mayer" }),

  step("provenance", 8, "provenance", "provenance", "Source names the synthetic report, Location identifies the laboratory value, and the technical locator remains available as secondary evidence.", "Source benennt den synthetischen Bericht, Location identifiziert den Laborwert, und der technische Locator bleibt als sekundärer Nachweis verfügbar.", { patientName: "Dirk Mayer" }),
  step("original-document", 8, "originalDocument", "original-document", "The original document view renders the same approved fixture and retains stable links from each value to its source location.", "Die Originaldokumentansicht rendert dasselbe freigegebene Fixture und bewahrt stabile Links jedes Werts zu seiner Fundstelle.", { patientName: "Dirk Mayer" }),

  step("import-boundary", 9, "import", "import-information", "This is how a future import workflow could look. In this Contest Demo every control remains disabled and no file is selected, read, or written.", "So könnte ein zukünftiger Import-Workflow aussehen. In dieser Contest Demo bleiben alle Bedienelemente deaktiviert; keine Datei wird ausgewählt, gelesen oder geschrieben."),
  step("conclusion", 10, "dashboard", "dashboard-overview", "LabDelta returns to the patient overview: local, traceable, deterministic comparison using synthetic demo data, without diagnosis, recommendation, cloud, or runtime AI.", "LabDelta kehrt zur Patientenübersicht zurück: lokale, nachvollziehbare, deterministische Vergleiche mit synthetischen Demodaten, ohne Diagnose, Empfehlung, Cloud oder Runtime-KI.")
] as const;
