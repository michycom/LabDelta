import { useEffect, useReducer, useRef } from "react";
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { DEMO_STEPS } from "./walkthrough";

export function useDemoWalkthrough() {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const step = DEMO_STEPS[state.stepIndex] ?? DEMO_STEPS[0]!;
  const spokenKey = useRef<string | null>(null);

  useEffect(() => {
    if (state.playback !== "playing") return;
    const timer = window.setTimeout(() => dispatch({ type: "advance" }), step.durationMs);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stepIndex, step.durationMs]);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const speech = window.speechSynthesis;
    if (state.playback === "paused") {
      speech.pause();
      return;
    }
    if (state.playback !== "playing") {
      speech.cancel();
      spokenKey.current = null;
      return;
    }
    const key = `${state.stepIndex}-${state.language}`;
    if (spokenKey.current === key) {
      speech.resume();
      return;
    }
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(step.subtitle[state.language]);
    utterance.lang = state.language === "de" ? "de-DE" : "en-US";
    utterance.rate = 0.96;
    speech.speak(utterance);
    spokenKey.current = key;
  }, [state.language, state.playback, state.stepIndex, step.subtitle]);

  useEffect(() => {
    if (state.playback !== "playing" && state.playback !== "paused") return;
    let target: HTMLElement | null = null;
    const timer = window.setTimeout(() => {
      target = document.querySelector<HTMLElement>(`[data-demo-target="${step.target}"]`);
      target?.classList.add("demo-walk-highlight");
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      target?.classList.remove("demo-walk-highlight");
    };
  }, [state.playback, state.stepIndex, step.target]);

  return {
    state,
    step,
    stepCount: DEMO_STEPS.length,
    play: () => dispatch({ type: "play" }),
    pause: () => dispatch({ type: "pause" }),
    stop: () => dispatch({ type: "stop" }),
    restart: () => dispatch({ type: "restart" }),
    setLanguage: (language: "en" | "de") => dispatch({ type: "setLanguage", language })
  };
}
