import { Pause, Play, RotateCcw, Square } from "lucide-react";
import type { DemoPlayback } from "../demo/demoMachine";
import type { DemoLanguage, DemoStep } from "../demo/walkthrough";

interface Props {
  playback: DemoPlayback;
  step: DemoStep;
  stepIndex: number;
  stepCount: number;
  language: DemoLanguage;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRestart: () => void;
  onLanguage: (language: DemoLanguage) => void;
}

export function DemoWalkthroughControls(props: Props) {
  const visibleSubtitle = props.playback === "playing" || props.playback === "paused";
  return <>
    <aside aria-label="Demo walkthrough controls" className="demo-walk-controls">
      <div><strong>Demo walkthrough</strong><small>{props.playback} · {props.stepIndex + 1}/{props.stepCount}</small></div>
      <button aria-label="Play demo" disabled={props.playback === "playing"} onClick={props.onPlay} type="button"><Play size={15} /></button>
      <button aria-label="Pause demo" disabled={props.playback !== "playing"} onClick={props.onPause} type="button"><Pause size={15} /></button>
      <button aria-label="Stop demo" disabled={props.playback === "idle" || props.playback === "stopped"} onClick={props.onStop} type="button"><Square size={14} /></button>
      <button aria-label="Restart demo" onClick={props.onRestart} type="button"><RotateCcw size={15} /></button>
      <div className="demo-language" aria-label="Demo language">
        <button aria-pressed={props.language === "en"} onClick={() => props.onLanguage("en")} type="button">EN</button>
        <button aria-pressed={props.language === "de"} onClick={() => props.onLanguage("de")} type="button">DE</button>
      </div>
    </aside>
    {visibleSubtitle ? <div className="demo-subtitle" key={`${props.step.id}-${props.language}`} role="status"><span>{props.stepIndex + 1} / {props.stepCount}</span><p>{props.step.subtitle[props.language]}</p>{props.playback === "paused" ? <strong>Paused</strong> : null}</div> : null}
  </>;
}
