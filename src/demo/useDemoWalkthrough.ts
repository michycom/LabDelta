import { useEffect, useReducer, useRef } from "react";
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { SpeechRunController, type SpeechFinishReason } from "./speechRun";
import { DEMO_STEPS } from "./walkthrough";

const CHAPTER_PAUSE_MS = 700;
const CHAPTER_LEAD_IN_MS = 400;

export function useDemoWalkthrough() {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const step = DEMO_STEPS[state.stepIndex] ?? DEMO_STEPS[0]!;
  const stateRef = useRef(state);
  const controllerRef = useRef<SpeechRunController | null>(null);
  const runKeyRef = useRef<string | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const leadInTimerRef = useRef<number | null>(null);
  const spokenChapterRef = useRef<number | null>(null);
  stateRef.current = state;

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
  };

  const clearLeadInTimer = () => {
    if (leadInTimerRef.current !== null) window.clearTimeout(leadInTimerRef.current);
    leadInTimerRef.current = null;
  };

  const cancelSpeech = (reason: Extract<SpeechFinishReason, "cancelled" | "manual-navigation" | "language-restart">) => {
    clearAdvanceTimer();
    clearLeadInTimer();
    runKeyRef.current = null;
    controllerRef.current?.cancel(reason);
  };

  useEffect(() => {
    if (typeof window.speechSynthesis === "undefined" || typeof window.SpeechSynthesisUtterance === "undefined") {
      if (state.playback !== "playing") return;
      const timer = window.setTimeout(() => dispatch({ type: "advance" }), step.durationMs);
      return () => window.clearTimeout(timer);
    }
    const controller = controllerRef.current ?? new SpeechRunController(window.speechSynthesis);
    controllerRef.current = controller;
    if (state.playback === "paused") {
      controller.pause();
      return;
    }
    if (state.playback !== "playing") {
      cancelSpeech("cancelled");
      return;
    }
    const runKey = `${state.stepIndex}-${state.language}`;
    if (runKeyRef.current === runKey && controller.activeRunId) {
      controller.resume();
      return;
    }
    if (controller.activeRunId) controller.cancel(controller.activeStepId === step.id ? "language-restart" : "manual-navigation");
    clearAdvanceTimer();
    runKeyRef.current = runKey;
    const startSpeech = () => {
      leadInTimerRef.current = null;
      spokenChapterRef.current = step.chapter;
      controller.start({
        stepId: step.id,
        text: step.subtitle[state.language],
        language: state.language,
        onComplete: () => {
          if (runKeyRef.current !== runKey) return;
          runKeyRef.current = null;
          advanceTimerRef.current = window.setTimeout(() => {
            advanceTimerRef.current = null;
            const current = stateRef.current;
            if (current.playback === "playing" && current.stepIndex === state.stepIndex && current.language === state.language) dispatch({ type: "advance" });
          }, CHAPTER_PAUSE_MS);
        }
      });
    };
    if (spokenChapterRef.current !== step.chapter) leadInTimerRef.current = window.setTimeout(startSpeech, CHAPTER_LEAD_IN_MS);
    else startSpeech();
    return clearLeadInTimer;
  }, [state.language, state.playback, state.stepIndex, step.chapter, step.durationMs, step.id, step.subtitle]);

  useEffect(() => () => cancelSpeech("cancelled"), []);

  useEffect(() => {
    if (state.playback !== "playing" && state.playback !== "paused") return;
    let target: HTMLElement | null = null;
    const applyHighlight = () => {
      if (target) return;
      target = document.querySelector<HTMLElement>(`[data-demo-target="${step.target}"]`);
      target?.classList.add("demo-walk-highlight");
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    };
    const timer = window.setTimeout(applyHighlight, 180);
    const observer = new MutationObserver(() => applyHighlight());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      target?.classList.remove("demo-walk-highlight");
    };
  }, [state.playback, state.stepIndex, step.target]);

  return {
    state,
    step,
    stepCount: DEMO_STEPS.length,
    play: () => dispatch({ type: "play" }),
    pause: () => { controllerRef.current?.pause(); dispatch({ type: "pause" }); },
    stop: () => { cancelSpeech("cancelled"); dispatch({ type: "stop" }); },
    restart: () => { cancelSpeech("manual-navigation"); dispatch({ type: "restart" }); },
    previous: () => { cancelSpeech("manual-navigation"); dispatch({ type: "previous" }); },
    next: () => { cancelSpeech("manual-navigation"); dispatch({ type: "next" }); },
    setLanguage: (language: "en" | "de") => {
      if (language !== stateRef.current.language) cancelSpeech("language-restart");
      dispatch({ type: "setLanguage", language });
    }
  };
}
