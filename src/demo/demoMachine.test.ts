import { describe, expect, it } from "vitest";
import { demoReducer, INITIAL_DEMO_STATE } from "./demoMachine";
import { CONTEST_DEMO_STEPS, DEMO_STEPS } from "./walkthrough";

describe("manual demo chapter state machine", () => {
  it("defines eleven concise deterministic chapters", () => {
    expect(DEMO_STEPS).toHaveLength(11);
    expect(DEMO_STEPS.map(step => step.chapter)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const step of DEMO_STEPS) {
      expect(step.subtitle.en.trim().split(/\s+/).length).toBeLessThanOrEqual(120);
      expect(step.subtitle.de.trim().split(/\s+/).length).toBeLessThanOrEqual(120);
    }
  });

  it("assigns distinct valid visual states to the final chapters", () => {
    expect(DEMO_STEPS[9]).toMatchObject({ id: "conclusion", section: "dashboard", target: "dashboard-overview", clearPatientSelection: true });
    expect(DEMO_STEPS[10]).toMatchObject({ id: "development-status", section: "limitations", target: "development-status", clearPatientSelection: true });
  });

  it("builds the contest sequence only from existing full-walkthrough chapters", () => {
    expect(CONTEST_DEMO_STEPS.map(step => step.id)).toEqual(["introduction", "dashboard", "analysis-overview", "history", "provenance", "development-status"]);
    expect(CONTEST_DEMO_STEPS.every(step => DEMO_STEPS.includes(step))).toBe(true);
  });

  it("starts either demo mode from its first chapter", () => {
    expect(demoReducer({ ...INITIAL_DEMO_STATE, stepIndex: 7 }, { type: "startMode", mode: "contest" })).toMatchObject({ mode: "contest", stepIndex: 0, playback: "preparing" });
    expect(demoReducer({ ...INITIAL_DEMO_STATE, stepIndex: 4 }, { type: "startMode", mode: "full" })).toMatchObject({ mode: "full", stepIndex: 0, playback: "preparing" });
  });

  it("plays and completes exactly the selected chapter without advancing", () => {
    const prepared = demoReducer(INITIAL_DEMO_STATE, { type: "play" });
    const playing = demoReducer(prepared, { type: "prepared" });
    const completed = demoReducer(playing, { type: "complete" });
    expect(prepared.playback).toBe("preparing");
    expect(completed).toMatchObject({ playback: "completed", stepIndex: 0 });
  });

  it("changes chapter selection without starting playback", () => {
    const next = demoReducer({ ...INITIAL_DEMO_STATE, playback: "playing" }, { type: "next" });
    expect(next).toMatchObject({ playback: "idle", stepIndex: 1 });
    expect(demoReducer(next, { type: "previous" })).toMatchObject({ playback: "idle", stepIndex: 0 });
  });

  it("starts a controller-selected chapter when autoplay is enabled", () => {
    const enabled = { ...INITIAL_DEMO_STATE, autoplay: true, stepIndex: 4, playback: "playing" as const };
    expect(demoReducer(enabled, { type: "next" })).toMatchObject({ playback: "preparing", stepIndex: 5 });
    expect(demoReducer(enabled, { type: "previous" })).toMatchObject({ playback: "preparing", stepIndex: 3 });
  });

  it("supports deterministic direct selection of chapters ten and eleven", () => {
    const chapterTen = demoReducer(INITIAL_DEMO_STATE, { type: "select", stepIndex: 9 });
    const chapterEleven = demoReducer(chapterTen, { type: "select", stepIndex: 10 });
    expect(chapterTen).toMatchObject({ playback: "idle", stepIndex: 9 });
    expect(chapterEleven).toMatchObject({ playback: "idle", stepIndex: 10 });
    expect(demoReducer({ ...chapterTen, autoplay: true }, { type: "select", stepIndex: 10 })).toMatchObject({ playback: "preparing", stepIndex: 10 });
  });

  it("replays the same chapter and stops without changing selection", () => {
    const selected = { ...INITIAL_DEMO_STATE, stepIndex: 4 };
    expect(demoReducer(selected, { type: "replay" })).toMatchObject({ playback: "preparing", stepIndex: 4 });
    expect(demoReducer(selected, { type: "stop" })).toMatchObject({ playback: "stopped", stepIndex: 4 });
  });

  it("advances automatically only after explicit autoplay opt-in", () => {
    const enabled = demoReducer({ ...INITIAL_DEMO_STATE, playback: "playing" }, { type: "setAutoplay", enabled: true });
    expect(demoReducer(enabled, { type: "complete" })).toMatchObject({ playback: "preparing", stepIndex: 1 });
  });
});
