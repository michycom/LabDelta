export type SpeechFinishReason = "ended" | "error" | "watchdog" | "cancelled" | "manual-navigation" | "language-restart";

export const SPEECH_RATE = 0.96;
export const SPEECH_WORDS_PER_MINUTE = 160;
export const SPEECH_SAFETY_MARGIN_MS = 3_000;
export const SPEECH_MIN_DURATION_MS = 5_000;
export const SPEECH_MAX_DURATION_MS = 30_000;

type SpeechEngine = Pick<SpeechSynthesis, "cancel" | "pause" | "resume" | "speak" | "speaking" | "pending" | "paused">;

interface SpeechRun {
  id: string;
  stepId: string;
  utterance: SpeechSynthesisUtterance;
  timer: number | null;
  deadline: number;
  remainingMs: number;
  onComplete: (reason: "ended" | "error" | "watchdog") => void;
}

export interface StartSpeechRun {
  stepId: string;
  text: string;
  language: "en" | "de";
  onComplete: SpeechRun["onComplete"];
}

export function estimateSpeechDurationMs(text: string, rate = SPEECH_RATE) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimated = words / (SPEECH_WORDS_PER_MINUTE * rate) * 60_000 + SPEECH_SAFETY_MARGIN_MS;
  return Math.min(SPEECH_MAX_DURATION_MS, Math.max(SPEECH_MIN_DURATION_MS, Math.ceil(estimated)));
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

  start({ stepId, text, language, onComplete }: StartSpeechRun) {
    this.cancel("manual-navigation");
    const utterance = this.createUtterance(text);
    const runId = `${stepId}-${++this.sequence}`;
    const durationMs = estimateSpeechDurationMs(text, SPEECH_RATE);
    const run: SpeechRun = {
      id: runId,
      stepId,
      utterance,
      timer: null,
      deadline: this.now() + durationMs,
      remainingMs: durationMs,
      onComplete
    };
    utterance.lang = language === "de" ? "de-DE" : "en-US";
    utterance.rate = SPEECH_RATE;
    utterance.onstart = () => this.log(run, "onstart");
    utterance.onend = () => {
      this.log(run, "onend");
      this.finishSpeechRun(runId, "ended");
    };
    utterance.onerror = event => {
      this.log(run, "onerror", "error" in event ? String(event.error) : undefined);
      this.finishSpeechRun(runId, "error");
    };
    this.active = run;
    this.scheduleWatchdog(run);
    this.log(run, "start", `durationMs=${durationMs}`);
    this.speech.speak(utterance);
    return runId;
  }

  pause() {
    const run = this.active;
    if (!run) return;
    if (run.timer !== null) window.clearTimeout(run.timer);
    run.timer = null;
    run.remainingMs = Math.max(0, run.deadline - this.now());
    this.speech.pause();
    this.log(run, "pause", `remainingMs=${run.remainingMs}`);
  }

  resume() {
    const run = this.active;
    if (!run || run.timer !== null) return;
    this.speech.resume();
    run.deadline = this.now() + run.remainingMs;
    this.scheduleWatchdog(run);
    this.log(run, "resume", `remainingMs=${run.remainingMs}`);
  }

  cancel(reason: Extract<SpeechFinishReason, "cancelled" | "manual-navigation" | "language-restart">) {
    const run = this.active;
    if (run) this.finishSpeechRun(run.id, reason);
    this.speech.cancel();
  }

  finishSpeechRun(runId: string, reason: SpeechFinishReason) {
    const run = this.active;
    if (!run || run.id !== runId) return false;
    if (run.timer !== null) window.clearTimeout(run.timer);
    run.timer = null;
    run.utterance.onstart = null;
    run.utterance.onend = null;
    run.utterance.onerror = null;
    this.active = null;
    const isCancellation = reason === "cancelled" || reason === "manual-navigation" || reason === "language-restart";
    this.log(run, reason === "watchdog" ? "watchdog timeout" : isCancellation ? "cancel" : reason, isCancellation ? `reason=${reason}` : undefined);
    if (reason === "ended" || reason === "error" || reason === "watchdog") run.onComplete(reason);
    return true;
  }

  private scheduleWatchdog(run: SpeechRun) {
    run.timer = window.setTimeout(() => this.finishSpeechRun(run.id, "watchdog"), run.remainingMs);
  }

  private log(run: SpeechRun, event: string, detail?: string) {
    const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
    if (!isDevelopment) return;
    console.debug(`[demo-speech] step=${run.stepId} utterance=${run.id} event=${event}${detail ? ` ${detail}` : ""} speaking=${this.speech.speaking} pending=${this.speech.pending} paused=${this.speech.paused}`);
  }
}
