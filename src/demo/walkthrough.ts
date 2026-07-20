import type { AppSection } from "../types";

export type DemoLanguage = "en" | "de";

export interface DemoStep {
  id: string;
  section: AppSection;
  target: string;
  patientName?: "Dirk Mayer";
  revealValueDetail?: boolean;
  durationMs: number;
  subtitle: Record<DemoLanguage, string>;
}

export const DEMO_STEPS: readonly DemoStep[] = [
  {
    id: "introduction",
    section: "dashboard",
    target: "demo-banner",
    durationMs: 15000,
    subtitle: {
      en: "Laboratory data is often distributed across multiple reports and isolated points in time. LabDelta demonstrates how longitudinal laboratory information can be organized transparently, compared mathematically, and traced back to its original source.",
      de: "Laborwerte liegen häufig über mehrere Berichte und einzelne Zeitpunkte verteilt vor. LabDelta demonstriert, wie longitudinale Laborinformationen transparent organisiert, mathematisch verglichen und bis zu ihrer Originalquelle zurückverfolgt werden können."
    }
  },
  {
    id: "dashboard",
    section: "dashboard",
    target: "dashboard",
    durationMs: 7000,
    subtitle: {
      en: "The dashboard reads three synthetic patients from local SQLite and orders them with transparent deterministic rules.",
      de: "Das Dashboard liest drei synthetische Personen aus der lokalen SQLite-Datenbank und sortiert sie nach transparenten deterministischen Regeln."
    }
  },
  {
    id: "dirk-mayer",
    section: "dashboard",
    target: "patient-dirk-mayer",
    patientName: "Dirk Mayer",
    durationMs: 6500,
    subtitle: {
      en: "Dirk Mayer is a fully synthetic patient with three reports and static, versioned profile assignments.",
      de: "Dirk Mayer ist eine vollständig synthetische Person mit drei Berichten und statischen, versionierten Profilzuordnungen."
    }
  },
  {
    id: "comparison",
    section: "reports",
    target: "confirmed-values",
    patientName: "Dirk Mayer",
    durationMs: 7500,
    subtitle: {
      en: "Confirmed values retain their original labels, supplied report references, units, and exact source locations.",
      de: "Bestätigte Werte behalten ihre Originalbezeichnungen, gelieferten Berichtsreferenzen, Einheiten und exakten Fundstellen."
    }
  },
  {
    id: "why",
    section: "dashboard",
    target: "value-explanation",
    patientName: "Dirk Mayer",
    revealValueDetail: true,
    durationMs: 7500,
    subtitle: {
      en: "The compact explanation shows the current and previous value, arithmetic difference, report reference status, provenance, and rule versions.",
      de: "Die kompakte Erklärung zeigt aktuellen und vorherigen Wert, mathematische Differenz, Berichtsreferenzstatus, Provenienz und Regelversionen."
    }
  },
  {
    id: "profiles",
    section: "reports",
    target: "assigned-profiles",
    patientName: "Dirk Mayer",
    durationMs: 6500,
    subtitle: {
      en: "Profiles are versioned organizational groups read from the approved fixture. They are not diagnoses or scores.",
      de: "Profile sind versionierte organisatorische Gruppen aus dem freigegebenen Fixture. Sie sind weder Diagnosen noch Bewertungen."
    }
  },
  {
    id: "history",
    section: "reports",
    target: "report-history",
    patientName: "Dirk Mayer",
    durationMs: 6500,
    subtitle: {
      en: "Three dated reports provide longitudinal data. Comparisons require the same parameter and exact unit.",
      de: "Drei datierte Berichte bilden den Verlauf. Vergleiche erfordern denselben Parameter und exakt dieselbe Einheit."
    }
  },
  {
    id: "provenance",
    section: "reports",
    target: "provenance",
    patientName: "Dirk Mayer",
    durationMs: 7000,
    subtitle: {
      en: "Every displayed working value remains linked to its synthetic source document, original text, and stored locator.",
      de: "Jeder angezeigte Arbeitswert bleibt mit seinem synthetischen Quelldokument, Originaltext und gespeicherten Locator verknüpft."
    }
  },
  {
    id: "import-boundary",
    section: "import",
    target: "import-information",
    durationMs: 6500,
    subtitle: {
      en: "Manual import is disabled. The Contest Demo uses only approved synthetic fixtures and opens no file dialog.",
      de: "Der manuelle Import ist deaktiviert. Die Contest Demo verwendet nur freigegebene synthetische Fixtures und öffnet keinen Dateidialog."
    }
  },
  {
    id: "conclusion",
    section: "dashboard",
    target: "demo-banner",
    durationMs: 7000,
    subtitle: {
      en: "LabDelta demonstrates local, traceable, deterministic data comparison without diagnosis, recommendation, cloud, or runtime AI.",
      de: "LabDelta demonstriert lokale, nachvollziehbare und deterministische Datenvergleiche ohne Diagnose, Empfehlung, Cloud oder Runtime-KI."
    }
  }
] as const;
