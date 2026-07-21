import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDemoWalkthrough } from "./useDemoWalkthrough";

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
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  speak: vi.fn((utterance: SpeechSynthesisUtterance) => utterances.push(utterance as unknown as HookUtterance))
};

beforeEach(() => {
  vi.useFakeTimers();
  utterances.length = 0;
  vi.clearAllMocks();
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: speech });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: HookUtterance });
  vi.stubGlobal("SpeechSynthesisUtterance", HookUtterance);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useDemoWalkthrough speech navigation", () => {
  it("restarts the same step on language change and ignores the old callback", () => {
    const { result, unmount } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(400));
    const oldEnd = utterances[0]!.onend!;
    act(() => result.current.setLanguage("de"));
    expect(result.current.state.stepIndex).toBe(0);
    expect(result.current.state.language).toBe("de");
    expect(utterances).toHaveLength(2);
    expect(utterances[1]!.lang).toBe("de-DE");
    act(() => oldEnd({} as SpeechSynthesisEvent));
    expect(result.current.state.stepIndex).toBe(0);
    unmount();
  });

  it("keeps next and previous manual and immune to late speech callbacks", () => {
    const { result, unmount } = renderHook(() => useDemoWalkthrough());
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(400));
    const firstLateEnd = utterances[0]!.onend!;
    act(() => result.current.next());
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state.stepIndex).toBe(1);
    const secondLateEnd = utterances[1]!.onend!;
    act(() => result.current.previous());
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state.stepIndex).toBe(0);
    act(() => {
      firstLateEnd({} as SpeechSynthesisEvent);
      secondLateEnd({} as SpeechSynthesisEvent);
    });
    expect(result.current.state.stepIndex).toBe(0);
    unmount();
  });
});
