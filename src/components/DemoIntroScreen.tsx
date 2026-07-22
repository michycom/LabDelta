import { Activity, Database, GitCompareArrows, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { DemoLanguage } from "../demo/walkthrough";
import { DEMO_STEPS } from "../demo/walkthrough";
import { useI18n } from "../i18n";

export function DemoIntroScreen({ language, paused, durationMs }: { language: DemoLanguage; paused: boolean; durationMs: number }) {
  const { t } = useI18n();
  const style = { "--intro-duration": `${durationMs}ms` } as CSSProperties;
  return <section className={paused ? "demo-intro paused" : "demo-intro"} data-demo-target="intro-screen" style={style}>
    <div className="intro-ambient" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 900 320"><path d="M0 220 C120 190 150 245 270 188 S430 125 520 160 S690 238 900 92" /><path d="M0 265 C130 210 210 274 330 230 S520 176 620 202 S770 185 900 130" /><circle cx="270" cy="188" r="5" /><circle cx="520" cy="160" r="5" /><circle cx="620" cy="202" r="5" /><circle cx="770" cy="185" r="5" /></svg></div>
    <div className="intro-content">
      <div className="intro-logo"><Activity size={52} /><span>LabDelta</span></div>
      <h1>{t("introTitle")}</h1><p className="intro-principles">{t("introPrinciples")}</p>
      <div className="intro-capabilities"><span><Database size={18} /> {t("introReports")}</span><span><GitCompareArrows size={18} /> {t("introComparison")}</span><span><MapPin size={18} /> {t("introTraceability")}</span></div>
      <p className="intro-narrative">{DEMO_STEPS[0]!.subtitle[language]}</p>
      <div className="intro-demo-label">{t("demoBanner")}</div><div className="intro-progress" aria-label={t("introProgress")}><i /></div>
    </div>
  </section>;
}
