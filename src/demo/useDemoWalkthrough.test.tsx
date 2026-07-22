import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estimateSpeechDurationMs, SPEECH_POST_END_DELAY_MS, SPEECH_SEGMENT_GAP_MS, SPEECH_WATCHDOG_RECHECK_MS, splitSpeechText } from "./speechRun";
import { useDemoWalkthrough } from "./useDemoWalkthrough";
import { DEMO_STEPS } from "./walkthrough";

class HookUtterance {
  lang = "";
  rate = 1;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  constructor(readonly text: string) {}
}

const utterances: HookUtterance[] = [];
const speech = {
  speaking: false,
  pending: false,
  paused: false,
  cancel: vi.fn(() => { speech.speaking = false; speech.pending = false; speech.paused = false; }),
  pause: vi.fn(() => { speech.paused = true; }),
  resume: vi.fn(() => { speech.paused = false; }),
  speak: vi.fn((utterance: SpeechSynthesisUtterance) => { utterances.push(utterance as unknown as HookUtterance); speech.speaking = true; })
};

beforeEach(() => {
  vi.useFakeTimers();
  utterances.length = 0;
  vi.clearAllMocks();
  speech.speaking = false;
  speech.pending = false;
  speech.paused = false;
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: speech });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: HookUtterance });
  vi.stubGlobal("SpeechSynthesisUtterance", HookUtterance);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function beginChapter(result: { current: ReturnType<typeof useDemoWalkthrough> }) {
  act(() => result.current.play());
  expect(result.current.state.playback).toBe("preparing");
  act(() => vi.advanceTimersByTime(400));
  expect(result.current.state.playback).toBe("playing");
}

function finishCurrentSpeech(result: { current: ReturnType<typeof useDemoWalkthrough> }) {
  const segments = splitSpeechText(result.current.step.subtitle[result.current.state.language]);
  for (let index = 0; index < segments.length; index += 1) {
    speech.speaking = false;
    act(() => utterances.at(-1)!.onend!({ charIndex: segments[index]!.length } as SpeechSynthesisEvent));
    expect(result.current.state.playback).toBe("playing");
    if (index < segments.length - 1) act(() => vi.advanceTimersByTime(SPEECH_SEGMENT_GAP_MS));
  }
  act(() => vi.advanceTimersByTime(SPEECH_POST_END_DELAY_MS));
}

describe("manual demo chapter controller", () => {
  it("plays one chapter and never advances after speech completion", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    beginChapter(result);
    expect(utterances[0]!.text).toBe(splitSpeechText(result.current.step.subtitle[result.current.state.language])[0]);
    finishCurrentSpeech(result);
    expect(result.current.state).toMatchObject({ playback: "completed", stepIndex: 0 });
    act(() => vi.runAllTimers());
    expect(result.current.state.stepIndex).toBe(0);
  });

  it("lets the watchdog complete only the active chapter", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    beginChapter(result);
    const segments = splitSpeechText(result.current.step.subtitle[result.current.state.language]);
    act(() => vi.advanceTimersByTime(estimateSpeechDurationMs(utterances[0]!.text)));
    expect(result.current.state.playback).toBe("playing");
    speech.speaking = false;
    act(() => vi.advanceTimersByTime(SPEECH_WATCHDOG_RECHECK_MS + SPEECH_SEGMENT_GAP_MS));
    for (let index = 1; index < segments.length; index += 1) {
      speech.speaking = false;
      act(() => utterances.at(-1)!.onend!({ charIndex: segments[index]!.length } as SpeechSynthesisEvent));
      if (index < segments.length - 1) act(() => vi.advanceTimersByTime(SPEECH_SEGMENT_GAP_MS));
    }
    act(() => vi.advanceTimersByTime(SPEECH_POST_END_DELAY_MS));
    expect(result.current.state).toMatchObject({ playback: "completed", stepIndex: 0 });
  });

  it("next and previous only change selection and ignore late callbacks", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    beginChapter(result);
    const lateEnd = utterances[0]!.onend!;
    act(() => result.current.next());
    expect(result.current.state).toMatchObject({ playback: "idle", stepIndex: 1 });
    expect(utterances).toHaveLength(1);
    act(() => lateEnd({} as SpeechSynthesisEvent));
    expect(result.current.state.stepIndex).toBe(1);
    act(() => result.current.previous());
    expect(result.current.state).toMatchObject({ playback: "idle", stepIndex: 0 });
  });

  it("selects and starts either final chapter directly", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.selectChapter(9));
    expect(result.current.step).toMatchObject({ id: "conclusion", section: "dashboard", target: "dashboard-overview" });
    beginChapter(result);
    act(() => result.current.selectChapter(10));
    expect(result.current.step).toMatchObject({ id: "development-status", section: "limitations", target: "development-status" });
    expect(result.current.state.playback).toBe("idle");
    beginChapter(result);
    expect(result.current.state).toMatchObject({ stepIndex: 10, playback: "playing" });
  });

  it("replays the same chapter with a new isolated utterance", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    beginChapter(result);
    const cancelledEnd = utterances[0]!.onend!;
    act(() => result.current.restart());
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state).toMatchObject({ playback: "playing", stepIndex: 0 });
    expect(utterances).toHaveLength(2);
    act(() => cancelledEnd({} as SpeechSynthesisEvent));
    expect(result.current.state).toMatchObject({ playback: "playing", stepIndex: 0 });
  });

  it("increments elapsed chapter time, pauses it, and resumes it", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    beginChapter(result);
    act(() => vi.advanceTimersByTime(1250));
    const elapsed = result.current.elapsedMs;
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.elapsedMs).toBe(elapsed);
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.elapsedMs).toBeGreaterThan(elapsed);
    expect(result.current.state.stepIndex).toBe(0);
  });

  it("stop clears speech and elapsed time without changing chapter", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.next());
    beginChapter(result);
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.stop());
    expect(result.current.state).toMatchObject({ playback: "stopped", stepIndex: 1 });
    expect(result.current.elapsedMs).toBe(0);
  });

  it("restarts the selected chapter in the new language", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.next());
    beginChapter(result);
    const oldEnd = utterances[0]!.onend!;
    act(() => result.current.setLanguage("de"));
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state).toMatchObject({ language: "de", stepIndex: 1, playback: "playing" });
    expect(utterances[1]!.text).toBe(splitSpeechText(result.current.step.subtitle.de)[0]);
    act(() => oldEnd({} as SpeechSynthesisEvent));
    expect(result.current.state.stepIndex).toBe(1);
  });

  it("autoplays all chapters only after each speech end and grace period", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.setAutoplay(true));
    beginChapter(result);
    for (let chapterIndex = 0; chapterIndex < DEMO_STEPS.length; chapterIndex += 1) {
      expect(result.current.state.stepIndex).toBe(chapterIndex);
      finishCurrentSpeech(result);
      if (chapterIndex < DEMO_STEPS.length - 1) {
        expect(result.current.state.playback).toBe("preparing");
        act(() => vi.advanceTimersByTime(400));
        expect(result.current.state.playback).toBe("playing");
      }
    }
    expect(result.current.state).toMatchObject({ stepIndex: DEMO_STEPS.length - 1, playback: "completed" });
  });

  it("supports keyboard playback, navigation, replay, and stop without key-repeat", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    fireEvent.keyDown(window, { key: "Enter" });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state.playback).toBe("playing");
    fireEvent.keyDown(window, { key: " ", repeat: true });
    expect(result.current.state.playback).toBe("playing");
    fireEvent.keyDown(window, { key: " " });
    expect(result.current.state.playback).toBe("paused");
    fireEvent.keyDown(window, { key: " " });
    expect(result.current.state.playback).toBe("playing");
    fireEvent.keyDown(window, { key: "N" });
    expect(result.current.state).toMatchObject({ stepIndex: 1, playback: "idle" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(result.current.state.stepIndex).toBe(0);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(result.current.state.stepIndex).toBe(1);
    fireEvent.keyDown(window, { key: "p" });
    expect(result.current.state.stepIndex).toBe(0);
    fireEvent.keyDown(window, { key: "r" });
    expect(result.current.state.playback).toBe("preparing");
    fireEvent.keyDown(window, { key: "s" });
    expect(result.current.state.playback).toBe("stopped");
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(result.current.state.playback).toBe("stopped");
  });

  it("autoplays keyboard navigation and ignores shortcuts from editable controls", () => {
    const { result } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.setAutoplay(true));
    fireEvent.keyDown(window, { key: "n" });
    expect(result.current.state).toMatchObject({ stepIndex: 1, playback: "preparing" });
    act(() => vi.advanceTimersByTime(400));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(result.current.state).toMatchObject({ stepIndex: 2, playback: "preparing" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(result.current.state).toMatchObject({ stepIndex: 1, playback: "preparing" });
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    fireEvent.keyDown(input, { key: "n" });
    expect(result.current.state.stepIndex).toBe(1);
    input.remove();
  });
});
