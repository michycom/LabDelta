export type SpeechFinishReason = "ended" | "error" | "watchdog" | "cancelled" | "manual-navigation" | "language-restart";

export const SPEECH_RATE = 0.96;
export const SPEECH_WORDS_PER_MINUTE = 160;
export const SPEECH_SAFETY_MARGIN_MS = 12_000;
export const SPEECH_MIN_DURATION_MS = 15_000;
export const SPEECH_MAX_DURATION_MS = 60_000;
export const SPEECH_POST_END_DELAY_MS = 500;
export const SPEECH_SEGMENT_GAP_MS = 60;
export const SPEECH_WATCHDOG_RECHECK_MS = 2_000;

type CompletionReason = "ended" | "error" | "watchdog";
type CancelReason = Extract<SpeechFinishReason, "cancelled" | "manual-navigation" | "language-restart">;
type SpeechEngine = Pick<SpeechSynthesis, "cancel" | "pause" | "resume" | "speak" | "speaking" | "pending" | "paused">;

interface SpeechRun {
  id: string;
  stepId: string;
  chapterIndex: number;
  fullText: string;
  segments: string[];
  segmentIndex: number;
  utterance: SpeechSynthesisUtterance | null;
  watchdogTimer: number | null;
  transitionTimer: number | null;
  deadline: number;
  remainingMs: number;
  lastCharIndex: number;
  language: "en" | "de" | "zh-CN";
  onComplete: (reason: CompletionReason) => void;
}

export interface StartSpeechRun {
  stepId: string;
  chapterIndex?: number;
  text: string;
  language: "en" | "de" | "zh-CN";
  onComplete: SpeechRun["onComplete"];
}

export function estimateSpeechDurationMs(text: string, rate = SPEECH_RATE) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimated = words / (SPEECH_WORDS_PER_MINUTE * rate) * 60_000 + SPEECH_SAFETY_MARGIN_MS;
  return Math.min(SPEECH_MAX_DURATION_MS, Math.max(SPEECH_MIN_DURATION_MS, Math.ceil(estimated)));
}

export function splitSpeechText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  return normalized.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(segment => segment.trim()).filter(Boolean) ?? [normalized];
}

export class SpeechRunController {
  private active: SpeechRun | null = null;
  private sequence = 0;

  constructor(
    private readonly speech: SpeechEngine,
    private readonly createUtterance: (text: string) => SpeechSynthesisUtterance = text => new SpeechSynthesisUtterance(text),
    private readonly now: () => number = () => Date.now()
  ) {}

  get activeRunId() { return this.active?.id ?? null; }
  get activeStepId() { return this.active?.stepId ?? null; }

  start({ stepId, chapterIndex, text, language, onComplete }: StartSpeechRun) {
    this.cancel("manual-navigation");
    const run: SpeechRun = {
      id: `${stepId}-${++this.sequence}`,
      stepId,
      chapterIndex: chapterIndex ?? 0,
      fullText: text,
      segments: splitSpeechText(text),
      segmentIndex: 0,
      utterance: null,
      watchdogTimer: null,
      transitionTimer: null,
      deadline: 0,
      remainingMs: 0,
      lastCharIndex: 0,
      language,
      onComplete
    };
    this.active = run;
    this.log(run, "playback-start", { textLength: text.length, textStart: text.slice(0, 60), textEnd: text.slice(-60), segmentCount: run.segments.length });
    this.speakCurrentSegment(run);
    return run.id;
  }

  pause() {
    const run = this.active;
    if (!run) return;
    this.clearWatchdog(run);
    run.remainingMs = Math.max(0, run.deadline - this.now());
    this.speech.pause();
    this.log(run, "pause", { remainingMs: run.remainingMs });
  }

  resume() {
    const run = this.active;
    if (!run || run.watchdogTimer !== null) return;
    this.speech.resume();
    run.deadline = this.now() + run.remainingMs;
    this.scheduleWatchdog(run);
    this.log(run, "resume", { remainingMs: run.remainingMs });
  }

  cancel(reason: CancelReason) {
    const run = this.active;
    if (run) this.finishSpeechRun(run.id, reason);
    else this.logCancelWithoutRun(reason);
    this.speech.cancel();
  }

  finishSpeechRun(runId: string, reason: SpeechFinishReason) {
    const run = this.active;
    if (!run || run.id !== runId) return false;
    this.clearTimers(run);
    this.invalidateUtterance(run);
    this.active = null;
    const cancelled = reason === "cancelled" || reason === "manual-navigation" || reason === "language-restart";
    this.log(run, cancelled ? "cancel" : "chapter-complete", { reason });
    if (!cancelled) run.onComplete(reason);
    return true;
  }

  private speakCurrentSegment(run: SpeechRun) {
    if (this.active?.id !== run.id) return;
    const segment = run.segments[run.segmentIndex];
    if (!segment) {
      this.scheduleChapterCompletion(run, "ended");
      return;
    }
    const utterance = this.createUtterance(segment);
    run.utterance = utterance;
    run.lastCharIndex = 0;
    utterance.lang = run.language === "de" ? "de-DE" : run.language === "zh-CN" ? "zh-CN" : "en-US";
    utterance.rate = SPEECH_RATE;
    utterance.onstart = event => this.log(run, "start", this.eventDetail(event));
    utterance.onboundary = event => {
      if (this.active?.id !== run.id || run.utterance !== utterance) return;
      run.lastCharIndex = Math.max(run.lastCharIndex, event.charIndex ?? 0);
      this.log(run, "boundary", this.eventDetail(event));
    };
    utterance.onend = event => {
      if (this.active?.id !== run.id || run.utterance !== utterance) return;
      const charIndex = event.charIndex ?? run.lastCharIndex;
      this.log(run, "end", this.eventDetail(event));
      if (charIndex > 0 && charIndex < segment.length - 2) {
        const remainder = segment.slice(charIndex).replace(/^\s+/, "");
        if (remainder) run.segments.splice(run.segmentIndex + 1, 0, remainder);
        this.log(run, "early-end-recovered", { charIndex, segmentLength: segment.length, remainderLength: remainder.length });
      }
      this.advanceSegment(run, "ended");
    };
    utterance.onerror = event => {
      if (this.active?.id !== run.id || run.utterance !== utterance) return;
      this.log(run, "error", { ...this.eventDetail(event), error: "error" in event ? String(event.error) : "unknown" });
      if (!this.speech.speaking && !this.speech.pending) this.advanceSegment(run, "error");
    };
    const durationMs = estimateSpeechDurationMs(segment, SPEECH_RATE);
    run.remainingMs = durationMs;
    run.deadline = this.now() + durationMs;
    this.scheduleWatchdog(run);
    this.log(run, "segment-queued", { segmentIndex: run.segmentIndex, segmentLength: segment.length, segmentStart: segment.slice(0, 45), segmentEnd: segment.slice(-45), watchdogMs: durationMs });
    this.speech.speak(utterance);
  }

  private advanceSegment(run: SpeechRun, reason: CompletionReason) {
    if (this.active?.id !== run.id) return;
    this.clearWatchdog(run);
    this.invalidateUtterance(run);
    if (run.segmentIndex >= run.segments.length - 1) {
      this.scheduleChapterCompletion(run, reason);
      return;
    }
    run.segmentIndex += 1;
    run.transitionTimer = window.setTimeout(() => {
      run.transitionTimer = null;
      this.speakCurrentSegment(run);
    }, SPEECH_SEGMENT_GAP_MS);
  }

  private scheduleWatchdog(run: SpeechRun) {
    run.watchdogTimer = window.setTimeout(() => {
      run.watchdogTimer = null;
      if (this.active?.id !== run.id) return;
      if (this.speech.speaking || this.speech.pending || this.speech.paused) {
        run.remainingMs = SPEECH_WATCHDOG_RECHECK_MS;
        run.deadline = this.now() + run.remainingMs;
        this.log(run, "watchdog-deferred", { recheckMs: SPEECH_WATCHDOG_RECHECK_MS });
        this.scheduleWatchdog(run);
        return;
      }
      this.log(run, "watchdog-stalled-segment", { lastCharIndex: run.lastCharIndex });
      this.advanceSegment(run, "watchdog");
    }, run.remainingMs);
  }

  private scheduleChapterCompletion(run: SpeechRun, reason: CompletionReason) {
    if (this.active?.id !== run.id || run.transitionTimer !== null) return;
    run.transitionTimer = window.setTimeout(() => {
      run.transitionTimer = null;
      this.finishSpeechRun(run.id, reason);
    }, SPEECH_POST_END_DELAY_MS);
    this.log(run, "completion-grace", { reason, delayMs: SPEECH_POST_END_DELAY_MS });
  }

  private clearWatchdog(run: SpeechRun) {
    if (run.watchdogTimer !== null) window.clearTimeout(run.watchdogTimer);
    run.watchdogTimer = null;
  }

  private clearTimers(run: SpeechRun) {
    this.clearWatchdog(run);
    if (run.transitionTimer !== null) window.clearTimeout(run.transitionTimer);
    run.transitionTimer = null;
  }

  private invalidateUtterance(run: SpeechRun) {
    if (!run.utterance) return;
    run.utterance.onstart = null;
    run.utterance.onboundary = null;
    run.utterance.onend = null;
    run.utterance.onerror = null;
    run.utterance = null;
  }

  private eventDetail(event: SpeechSynthesisEvent | SpeechSynthesisErrorEvent) {
    return { elapsedTime: event.elapsedTime ?? 0, charIndex: event.charIndex ?? 0 };
  }

  private log(run: SpeechRun, event: string, detail: Record<string, unknown> = {}) {
    if (!(import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) return;
    console.debug("[demo-speech]", { playbackId: run.id, chapterIndex: run.chapterIndex, stepId: run.stepId, segmentIndex: run.segmentIndex, event, speaking: this.speech.speaking, pending: this.speech.pending, paused: this.speech.paused, ...detail });
  }

  private logCancelWithoutRun(reason: CancelReason) {
    if (!(import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) return;
    console.debug("[demo-speech]", { playbackId: null, event: "cancel", reason, speaking: this.speech.speaking, pending: this.speech.pending, paused: this.speech.paused });
  }
}
