import { Activity, Database, GitCompareArrows, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { DemoLanguage } from "../demo/walkthrough";

export function DemoIntroScreen({ language, paused, durationMs }: { language: DemoLanguage; paused: boolean; durationMs: number }) {
  const style = { "--intro-duration": `${durationMs}ms` } as CSSProperties;
  return <section className={paused ? "demo-intro paused" : "demo-intro"} data-demo-target="intro-screen" style={style}>
    <div className="intro-ambient" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 900 320"><path d="M0 220 C120 190 150 245 270 188 S430 125 520 160 S690 238 900 92" /><path d="M0 265 C130 210 210 274 330 230 S520 176 620 202 S770 185 900 130" /><circle cx="270" cy="188" r="5" /><circle cx="520" cy="160" r="5" /><circle cx="620" cy="202" r="5" /><circle cx="770" cy="185" r="5" /></svg></div>
    <div className="intro-content">
      <div className="intro-logo"><Activity size={52} /><span>LabDelta</span></div>
      <h1>Transparent longitudinal laboratory data</h1>
      <p className="intro-principles">Local <b>·</b> Explainable <b>·</b> Synthetic demo data</p>
      <div className="intro-capabilities"><span><Database size={18} /> Local reports</span><span><GitCompareArrows size={18} /> Mathematical comparison</span><span><MapPin size={18} /> Source traceability</span></div>
      <p className="intro-narrative">{language === "de" ? "Laborwerte liegen häufig über mehrere Berichte und einzelne Zeitpunkte verteilt vor. LabDelta demonstriert, wie longitudinale Laborinformationen transparent organisiert, mathematisch verglichen und bis zu ihrer Originalquelle zurückverfolgt werden können." : "Laboratory data is often distributed across multiple reports and isolated points in time. LabDelta demonstrates how longitudinal laboratory information can be organized transparently, compared mathematically, and traced back to its original source."}</p>
      <div className="intro-demo-label">Demo – ausschließlich synthetische Testdaten</div>
      <div className="intro-progress" aria-label="Introduction progress"><i /></div>
    </div>
  </section>;
}
