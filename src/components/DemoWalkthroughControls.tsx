import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Square } from "lucide-react";
import type { DemoPlayback } from "../demo/demoMachine";
import { localizedChapterName, type DemoLanguage, type DemoStep } from "../demo/walkthrough";
import { useI18n } from "../i18n";

interface Props { playback: DemoPlayback; step: DemoStep; stepIndex: number; stepCount: number; elapsedMs: number; autoplay: boolean; language: DemoLanguage; onPlay: () => void; onPause: () => void; onStop: () => void; onReplay: () => void; onPrevious: () => void; onNext: () => void; onAutoplay: (enabled: boolean) => void; onLanguage: (language: DemoLanguage) => void; }
function formatElapsed(elapsedMs: number) { const seconds = Math.floor(elapsedMs / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export function DemoWalkthroughControls(props: Props) {
  const { t } = useI18n();
  const visibleSubtitle = ["preparing", "playing", "paused", "completed"].includes(props.playback);
  const status = props.playback === "completed" ? t("chapterComplete") : props.playback === "preparing" ? t("preparing") : props.playback === "paused" ? t("paused") : props.playback === "playing" ? t("playing") : props.playback === "stopped" ? t("stopped") : t("ready");
  const transitioning = props.playback === "preparing";
  const mainLabel = props.playback === "playing" ? t("pause") : props.playback === "paused" ? t("resume") : t("play");
  const progress = (props.stepIndex + 1) / props.stepCount * 100;
  return <>
    <aside aria-label={t("demoControls")} className="demo-walk-controls chapter-controls">
      <div className="chapter-readout"><span><b>{props.stepIndex + 1} / {props.stepCount}</b><strong>{localizedChapterName(props.step.name, props.language)}</strong><time>{formatElapsed(props.elapsedMs)}</time></span><div aria-label={t("walkthroughProgress")} aria-valuemax={props.stepCount} aria-valuemin={1} aria-valuenow={props.stepIndex + 1} className="walkthrough-progress" role="progressbar"><i style={{ width: `${progress}%` }} /></div><small>{status}</small></div>
      <button aria-keyshortcuts="P ArrowLeft" aria-label={t("previousChapter")} disabled={transitioning || props.stepIndex === 0} onClick={props.onPrevious} title={`${t("previousChapter")} · P / ←`} type="button"><ChevronLeft size={16} /></button>
      <button aria-keyshortcuts="Enter Space" aria-label={mainLabel} className="chapter-primary" disabled={transitioning} onClick={props.playback === "playing" ? props.onPause : props.onPlay} type="button">{props.playback === "playing" ? <Pause size={15} /> : <Play size={15} />}{mainLabel}</button>
      <button aria-keyshortcuts="N ArrowRight" aria-label={t("nextChapter")} disabled={transitioning || props.stepIndex === props.stepCount - 1} onClick={props.onNext} title={`${t("nextChapter")} · N / →`} type="button"><ChevronRight size={16} /></button>
      <button aria-keyshortcuts="R" aria-label={t("replay")} disabled={transitioning} onClick={props.onReplay} title={`${t("replay")} · R`} type="button"><RotateCcw size={15} /></button>
      <button aria-keyshortcuts="S Escape" aria-label={t("stop")} disabled={transitioning || props.playback === "idle" || props.playback === "stopped"} onClick={props.onStop} title={`${t("stop")} · S / Esc`} type="button"><Square size={13} /></button>
      <label className="demo-autoplay"><input checked={props.autoplay} onChange={event => props.onAutoplay(event.target.checked)} type="checkbox" />{t("autoplay")}</label>
      <div className="demo-language" aria-label={t("demoLanguage")}><button aria-pressed={props.language === "en"} onClick={() => props.onLanguage("en")} type="button">EN</button><button aria-pressed={props.language === "de"} onClick={() => props.onLanguage("de")} type="button">DE</button><button aria-pressed={props.language === "zh-CN"} onClick={() => props.onLanguage("zh-CN")} type="button">中文</button></div>
      <details className="shortcut-help"><summary aria-label={t("keyboardShortcuts")}>{t("keys")}</summary><span>{t("shortcutHelp")}</span></details>
    </aside>
    {visibleSubtitle ? <div className="demo-subtitle" key={`${props.step.id}-${props.language}`} role="status"><p>{props.step.subtitle[props.language]}</p>{props.playback === "completed" ? <strong>{t("chapterComplete")}</strong> : null}</div> : null}
  </>;
}
