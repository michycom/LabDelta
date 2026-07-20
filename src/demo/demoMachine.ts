import type { DemoLanguage } from "./walkthrough";
import { DEMO_STEPS } from "./walkthrough";

export type DemoPlayback = "idle" | "playing" | "paused" | "stopped" | "completed";

export interface DemoState {
  playback: DemoPlayback;
  stepIndex: number;
  language: DemoLanguage;
}

export type DemoAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "restart" }
  | { type: "advance" }
  | { type: "setLanguage"; language: DemoLanguage };

export const INITIAL_DEMO_STATE: DemoState = {
  playback: "idle",
  stepIndex: 0,
  language: "en"
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "play":
      return {
        ...state,
        playback: "playing",
        stepIndex: state.playback === "completed" ? 0 : state.stepIndex
      };
    case "pause":
      return state.playback === "playing" ? { ...state, playback: "paused" } : state;
    case "stop":
      return { ...state, playback: "stopped", stepIndex: 0 };
    case "restart":
      return { ...state, playback: "playing", stepIndex: 0 };
    case "advance":
      if (state.playback !== "playing") return state;
      if (state.stepIndex === DEMO_STEPS.length - 1) return { ...state, playback: "completed" };
      return { ...state, stepIndex: state.stepIndex + 1 };
    case "setLanguage":
      return { ...state, language: action.language };
  }
}
