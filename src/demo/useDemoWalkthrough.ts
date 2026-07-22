import { useEffect, useReducer, useRef, useState } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { SpeechRunController, type SpeechFinishReason } from "./speechRun";
import { stepsForMode, type DemoMode } from "./walkthrough";

const CHAPTER_LEAD_IN_MS = 400;

export function useDemoWalkthrough() {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const [elapsedMs, setElapsedMs] = useState(0);
  const steps = stepsForMode(state.mode);
  const step = steps[state.stepIndex] ?? steps[0]!;
  const stateRef = useRef(state);
  const controllerRef = useRef<SpeechRunController | null>(null);
  const runKeyRef = useRef<string | null>(null);
  const preparationTimerRef = useRef<number | null>(null);
  stateRef.current = state;

  const clearPreparationTimer = () => {
    if (preparationTimerRef.current !== null) window.clearTimeout(preparationTimerRef.current);
    preparationTimerRef.current = null;
  };

  const cancelSpeech = (reason: Extract<SpeechFinishReason, "cancelled" | "manual-navigation" | "language-restart">) => {
    clearPreparationTimer();
    runKeyRef.current = null;
    controllerRef.current?.cancel(reason);
  };

  useEffect(() => {
    if (state.playback !== "preparing") return;
    preparationTimerRef.current = window.setTimeout(() => {
      preparationTimerRef.current = null;
      dispatch({ type: "prepared" });
    }, CHAPTER_LEAD_IN_MS);
    return clearPreparationTimer;
  }, [state.playback, state.runSequence]);

  useEffect(() => {
    if (state.playback !== "playing") return;
    const timer = window.setInterval(() => setElapsedMs(value => value + 250), 250);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useEffect(() => setElapsedMs(0), [state.stepIndex]);

  useEffect(() => {
    if (typeof window.speechSynthesis === "undefined" || typeof window.SpeechSynthesisUtterance === "undefined") {
      return;
    }
    const controller = controllerRef.current ?? new SpeechRunController(window.speechSynthesis);
    controllerRef.current = controller;
    if (state.playback === "paused") {
      controller.pause();
      return;
    }
    if (state.playback !== "playing") {
      if (state.playback === "idle" || state.playback === "stopped") cancelSpeech("cancelled");
      return;
    }
    const runKey = `${state.stepIndex}-${state.language}-${state.runSequence}`;
    if (runKeyRef.current === runKey && controller.activeRunId) {
      controller.resume();
      return;
    }
    if (controller.activeRunId) controller.cancel(controller.activeStepId === step.id ? "language-restart" : "manual-navigation");
    runKeyRef.current = runKey;
    controller.start({
      stepId: step.id,
      chapterIndex: state.stepIndex,
      text: step.subtitle[state.language],
      language: state.language,
      onComplete: () => {
        if (runKeyRef.current !== runKey) return;
        runKeyRef.current = null;
        const current = stateRef.current;
        if (current.playback === "playing" && current.stepIndex === state.stepIndex && current.runSequence === state.runSequence) dispatch({ type: "complete" });
      }
    });
  }, [state.language, state.playback, state.runSequence, state.stepIndex, step.id, step.subtitle]);

  useEffect(() => () => cancelSpeech("cancelled"), []);

  useEffect(() => {
    if (!["idle", "preparing", "playing", "paused", "completed"].includes(state.playback)) return;
    let target: HTMLElement | null = null;
    const applyHighlight = () => {
      if (typeof document === "undefined") return;
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

  const startFresh = (action: "play" | "replay") => {
    cancelSpeech("manual-navigation");
    setElapsedMs(0);
    dispatch({ type: action });
  };

  const play = () => {
    if (stateRef.current.playback === "paused") dispatch({ type: "play" });
    else startFresh("play");
  };
  const pause = () => { controllerRef.current?.pause(); dispatch({ type: "pause" }); };
  const stop = () => { cancelSpeech("cancelled"); setElapsedMs(0); dispatch({ type: "stop" }); };
  const restart = () => startFresh("replay");
  const previous = () => { cancelSpeech("manual-navigation"); setElapsedMs(0); dispatch({ type: "previous" }); };
  const next = () => { cancelSpeech("manual-navigation"); setElapsedMs(0); dispatch({ type: "next" }); };
  const selectChapter = (stepIndex: number) => { cancelSpeech("manual-navigation"); setElapsedMs(0); dispatch({ type: "select", stepIndex }); };
  const startMode = (mode: DemoMode) => { cancelSpeech("manual-navigation"); setElapsedMs(0); dispatch({ type: "startMode", mode }); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName))) return;
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const handled = ["enter", " ", "n", "arrowright", "p", "arrowleft", "r", "s", "escape"].includes(key);
      if (!handled) return;
      event.preventDefault();
      if (key === "enter") play();
      else if (key === " ") { if (stateRef.current.playback === "playing") pause(); else play(); }
      else if (key === "n" || key === "arrowright") next();
      else if (key === "p" || key === "arrowleft") previous();
      else if (key === "r") restart();
      else stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    state,
    step,
    stepCount: steps.length,
    elapsedMs,
    play,
    pause,
    stop,
    restart,
    previous,
    next,
    selectChapter,
    startMode,
    setAutoplay: (enabled: boolean) => dispatch({ type: "setAutoplay", enabled }),
    setLanguage: (language: "en" | "de" | "zh-CN") => {
      if (language !== stateRef.current.language && ["preparing", "playing", "paused"].includes(stateRef.current.playback)) {
        cancelSpeech("language-restart");
        setElapsedMs(0);
        dispatch({ type: "replay" });
      }
      dispatch({ type: "setLanguage", language });
    }
  };
}
