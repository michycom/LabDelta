import { describe, expect, it } from "vitest";
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { DEMO_STEPS } from "./walkthrough";

describe("demo walkthrough state machine", () => {
  it("defines the requested ten deterministic steps", () => {
    expect(DEMO_STEPS).toHaveLength(10);
    expect(DEMO_STEPS.map(step => step.id)).toEqual(["introduction", "dashboard", "dirk-mayer", "comparison", "why", "profiles", "history", "provenance", "import-boundary", "conclusion"]);
  });

  it("plays, pauses, resumes, stops, and restarts without hidden transitions", () => {
    const playing = demoReducer(INITIAL_DEMO_STATE, { type: "play" });
    const advanced = demoReducer(playing, { type: "advance" });
    const paused = demoReducer(advanced, { type: "pause" });
    expect(demoReducer(paused, { type: "advance" })).toEqual(paused);
    expect(demoReducer(paused, { type: "play" }).playback).toBe("playing");
    expect(demoReducer(advanced, { type: "stop" })).toMatchObject({ playback: "stopped", stepIndex: 0 });
    expect(demoReducer(advanced, { type: "restart" })).toMatchObject({ playback: "playing", stepIndex: 0 });
  });

  it("completes after the final step and changes language independently", () => {
    const finalStep = { ...INITIAL_DEMO_STATE, playback: "playing" as const, stepIndex: DEMO_STEPS.length - 1 };
    expect(demoReducer(finalStep, { type: "advance" }).playback).toBe("completed");
    expect(demoReducer(finalStep, { type: "setLanguage", language: "de" })).toMatchObject({ language: "de", stepIndex: 9 });
  });
});
