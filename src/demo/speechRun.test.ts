import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estimateSpeechDurationMs, SPEECH_POST_END_DELAY_MS, SPEECH_SEGMENT_GAP_MS, SPEECH_WATCHDOG_RECHECK_MS, SpeechRunController, splitSpeechText } from "./speechRun";

class FakeUtterance {
  lang = "";
  rate = 1;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  constructor(readonly text: string) {}
}

class FakeSpeech {
  speaking = false;
  pending = false;
  paused = false;
  utterances: FakeUtterance[] = [];
  cancel = vi.fn(() => { this.speaking = false; this.pending = false; this.paused = false; });
  pause = vi.fn(() => { this.paused = true; });
  resume = vi.fn(() => { this.paused = false; });
  speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
    this.utterances.push(utterance as unknown as FakeUtterance);
    this.speaking = true;
  });
}

function setup() {
  const speech = new FakeSpeech();
  const controller = new SpeechRunController(speech, text => new FakeUtterance(text) as unknown as SpeechSynthesisUtterance);
  return { speech, controller };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("SpeechRunController", () => {
  it("uses the watchdog only after speech has stopped without onend", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    const text = "This spoken sentence deliberately has no end callback.";
    controller.start({ stepId: "watchdog-step", text, language: "en", onComplete: complete });
    vi.advanceTimersByTime(estimateSpeechDurationMs(text));
    expect(complete).not.toHaveBeenCalled();
    expect(controller.activeRunId).not.toBeNull();
    speech.speaking = false;
    vi.advanceTimersByTime(SPEECH_WATCHDOG_RECHECK_MS + SPEECH_POST_END_DELAY_MS);
    expect(complete).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledWith("watchdog");
    expect(controller.activeRunId).toBeNull();
  });

  it("advances exactly once when onend and watchdog occur together", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    const text = "A race between end and watchdog remains deterministic.";
    controller.start({ stepId: "race", text, language: "en", onComplete: complete });
    const lateEnd = speech.utterances[0]!.onend!;
    lateEnd({} as SpeechSynthesisEvent);
    expect(complete).not.toHaveBeenCalled();
    speech.speaking = false;
    vi.advanceTimersByTime(SPEECH_POST_END_DELAY_MS);
    vi.advanceTimersByTime(estimateSpeechDurationMs(text));
    lateEnd({} as SpeechSynthesisEvent);
    expect(complete).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledWith("ended");
  });

  it("treats a speech error as a regular exactly-once completion", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    controller.start({ stepId: "error", text: "The engine reports an error.", language: "en", onComplete: complete });
    speech.speaking = false;
    speech.utterances[0]!.onerror!({ error: "synthesis-failed" } as SpeechSynthesisErrorEvent);
    vi.advanceTimersByTime(SPEECH_POST_END_DELAY_MS);
    expect(complete).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledWith("error");
  });

  it("ignores a callback delivered after cancel", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    controller.start({ stepId: "cancel", text: "Cancel this run.", language: "en", onComplete: complete });
    const lateEnd = speech.utterances[0]!.onend!;
    controller.cancel("manual-navigation");
    lateEnd({} as SpeechSynthesisEvent);
    vi.runAllTimers();
    expect(complete).not.toHaveBeenCalled();
    expect(controller.activeRunId).toBeNull();
  });

  it("restarts the same step in another language with a fresh utterance", () => {
    const { speech, controller } = setup();
    const oldComplete = vi.fn();
    const newComplete = vi.fn();
    controller.start({ stepId: "language", text: "English text", language: "en", onComplete: oldComplete });
    const oldRunId = controller.activeRunId;
    const lateEnd = speech.utterances[0]!.onend!;
    controller.cancel("language-restart");
    controller.start({ stepId: "language", text: "Deutscher Text", language: "de", onComplete: newComplete });
    expect(controller.activeStepId).toBe("language");
    expect(controller.activeRunId).not.toBe(oldRunId);
    expect(speech.utterances[1]!.lang).toBe("de-DE");
    lateEnd({} as SpeechSynthesisEvent);
    vi.advanceTimersByTime(estimateSpeechDurationMs("Deutscher Text"));
    expect(oldComplete).not.toHaveBeenCalled();
    expect(newComplete).not.toHaveBeenCalled();
  });

  it("stops the watchdog while paused and resumes with the remainder", () => {
    const { controller } = setup();
    const complete = vi.fn();
    const text = "Pause preserves the remaining watchdog time.";
    const duration = estimateSpeechDurationMs(text);
    controller.start({ stepId: "pause", text, language: "en", onComplete: complete });
    vi.advanceTimersByTime(2_000);
    controller.pause();
    vi.advanceTimersByTime(duration * 2);
    expect(complete).not.toHaveBeenCalled();
    controller.resume();
    vi.advanceTimersByTime(duration - 2_001);
    expect(complete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(complete).not.toHaveBeenCalled();
    expect(controller.activeRunId).not.toBeNull();
  });

  it("clears utterance handlers and timer on stop", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    controller.start({ stepId: "stop", text: "Stop this speech.", language: "en", onComplete: complete });
    const utterance = speech.utterances[0]!;
    controller.cancel("cancelled");
    expect(utterance.onstart).toBeNull();
    expect(utterance.onboundary).toBeNull();
    expect(utterance.onend).toBeNull();
    expect(utterance.onerror).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    expect(complete).not.toHaveBeenCalled();
  });

  it("speaks every natural segment before completing the diagnosis sentence", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    const text = "It does not make a diagnosis. It does not prioritize or recommend clinical decisions.";
    expect(splitSpeechText(text)).toHaveLength(2);
    controller.start({ stepId: "diagnosis", chapterIndex: 9, text, language: "en", onComplete: complete });
    speech.speaking = false;
    speech.utterances[0]!.onend!({ charIndex: speech.utterances[0]!.text.length } as SpeechSynthesisEvent);
    vi.advanceTimersByTime(SPEECH_SEGMENT_GAP_MS);
    expect(speech.utterances[1]!.text).toBe("It does not prioritize or recommend clinical decisions.");
    expect(complete).not.toHaveBeenCalled();
    speech.speaking = false;
    speech.utterances[1]!.onend!({ charIndex: speech.utterances[1]!.text.length } as SpeechSynthesisEvent);
    vi.advanceTimersByTime(SPEECH_POST_END_DELAY_MS);
    expect(complete).toHaveBeenCalledOnce();
  });

  it("recovers a reliable early end from the remaining word boundary", () => {
    const { speech, controller } = setup();
    const complete = vi.fn();
    const text = "This view does not make a diagnosis or recommend a clinical decision.";
    const charIndex = text.indexOf(" or recommend");
    controller.start({ stepId: "early-end", text, language: "en", onComplete: complete });
    speech.speaking = false;
    speech.utterances[0]!.onend!({ charIndex } as SpeechSynthesisEvent);
    vi.advanceTimersByTime(SPEECH_SEGMENT_GAP_MS);
    expect(speech.utterances[1]!.text).toBe("or recommend a clinical decision.");
    expect(complete).not.toHaveBeenCalled();
  });
});
