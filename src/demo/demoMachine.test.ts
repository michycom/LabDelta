import { describe, expect, it } from "vitest";
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { DEMO_STEPS } from "./walkthrough";

describe("demo walkthrough state machine", () => {
  it("defines ten deterministic chapters with individual screen parts", () => {
    expect([...new Set(DEMO_STEPS.map(step => step.chapter))]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(DEMO_STEPS.map(step => step.id)).toContain("dashboard-trends");
    expect(DEMO_STEPS.map(step => step.id)).toContain("analysis-change");
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
    expect(demoReducer(finalStep, { type: "setLanguage", language: "de" })).toMatchObject({ language: "de", stepIndex: DEMO_STEPS.length - 1 });
  });

  it("moves exactly one step and remains inside the sequence", () => {
    expect(demoReducer(INITIAL_DEMO_STATE, { type: "previous" }).stepIndex).toBe(0);
    const next = demoReducer(INITIAL_DEMO_STATE, { type: "next" });
    expect(next).toMatchObject({ stepIndex: 1, playback: "idle" });
    expect(demoReducer(next, { type: "previous" }).stepIndex).toBe(0);
    const finalStep = { ...INITIAL_DEMO_STATE, stepIndex: DEMO_STEPS.length - 1 };
    expect(demoReducer(finalStep, { type: "next" }).stepIndex).toBe(DEMO_STEPS.length - 1);
  });
});
