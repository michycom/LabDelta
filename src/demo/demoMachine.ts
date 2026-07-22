import type { DemoLanguage, DemoMode } from "./walkthrough";
import { stepsForMode } from "./walkthrough";

export type DemoPlayback = "idle" | "preparing" | "playing" | "paused" | "stopped" | "completed";

export interface DemoState {
  playback: DemoPlayback;
  stepIndex: number;
  language: DemoLanguage;
  autoplay: boolean;
  runSequence: number;
  mode: DemoMode;
}

export type DemoAction =
  | { type: "play" }
  | { type: "prepared" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "replay" }
  | { type: "previous" }
  | { type: "next" }
  | { type: "select"; stepIndex: number }
  | { type: "complete" }
  | { type: "setAutoplay"; enabled: boolean }
  | { type: "setLanguage"; language: DemoLanguage }
  | { type: "startMode"; mode: DemoMode };

export const INITIAL_DEMO_STATE: DemoState = {
  playback: "idle",
  stepIndex: 0,
  language: "en",
  autoplay: false,
  runSequence: 0,
  mode: "full"
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "play":
      if (state.playback === "playing" || state.playback === "preparing") return state;
      if (state.playback === "paused") return { ...state, playback: "playing" };
      return { ...state, playback: "preparing", runSequence: state.runSequence + 1 };
    case "prepared":
      return state.playback === "preparing" ? { ...state, playback: "playing" } : state;
    case "pause":
      return state.playback === "playing" ? { ...state, playback: "paused" } : state;
    case "stop":
      return { ...state, playback: "stopped", runSequence: state.runSequence + 1 };
    case "replay":
      return { ...state, playback: "preparing", runSequence: state.runSequence + 1 };
    case "previous":
      return { ...state, playback: state.autoplay ? "preparing" : "idle", stepIndex: Math.max(0, state.stepIndex - 1), runSequence: state.runSequence + 1 };
    case "next":
      return { ...state, playback: state.autoplay ? "preparing" : "idle", stepIndex: Math.min(stepsForMode(state.mode).length - 1, state.stepIndex + 1), runSequence: state.runSequence + 1 };
    case "select":
      return { ...state, playback: state.autoplay ? "preparing" : "idle", stepIndex: Math.max(0, Math.min(stepsForMode(state.mode).length - 1, action.stepIndex)), runSequence: state.runSequence + 1 };
    case "complete":
      if (state.playback !== "playing") return state;
      if (state.autoplay && state.stepIndex < stepsForMode(state.mode).length - 1) {
        return { ...state, playback: "preparing", stepIndex: state.stepIndex + 1, runSequence: state.runSequence + 1 };
      }
      return { ...state, playback: "completed" };
    case "setAutoplay":
      return { ...state, autoplay: action.enabled };
    case "setLanguage":
      return { ...state, language: action.language };
    case "startMode":
      return { ...state, mode: action.mode, stepIndex: 0, playback: "preparing", runSequence: state.runSequence + 1 };
  }
}
