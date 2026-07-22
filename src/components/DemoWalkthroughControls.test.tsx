import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_STEPS } from "../demo/walkthrough";
import { DemoWalkthroughControls } from "./DemoWalkthroughControls";

const handlers = {
  onPlay: vi.fn(), onPause: vi.fn(), onStop: vi.fn(), onReplay: vi.fn(),
  onPrevious: vi.fn(), onNext: vi.fn(), onAutoplay: vi.fn(), onLanguage: vi.fn()
};

afterEach(cleanup);

describe("DemoWalkthroughControls", () => {
  it("shows chapter identity, elapsed time, exact subtitle, and completion", () => {
    const step = DEMO_STEPS[3]!;
    render(<DemoWalkthroughControls {...handlers} autoplay={false} elapsedMs={18_900} language="en" playback="completed" step={step} stepCount={10} stepIndex={3} />);
    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByText("Analysis Overview")).toBeInTheDocument();
    expect(screen.getByText("00:18")).toBeInTheDocument();
    expect(screen.getAllByText("Chapter complete").length).toBeGreaterThan(0);
    expect(screen.getByText(step.subtitle.en)).toBeInTheDocument();
  });

  it("exposes manual chapter controls and explicit autoplay opt-in", () => {
    render(<DemoWalkthroughControls {...handlers} autoplay={false} elapsedMs={0} language="en" playback="idle" step={DEMO_STEPS[0]!} stepCount={10} stepIndex={0} />);
    expect(screen.getByRole("button", { name: "Play chapter" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous chapter" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Autoplay" }));
    expect(handlers.onAutoplay).toHaveBeenCalledWith(true);
  });

  it("uses one main play-pause control and exposes walkthrough progress", () => {
    const { rerender } = render(<DemoWalkthroughControls {...handlers} autoplay playback="playing" elapsedMs={1_000} language="en" step={DEMO_STEPS[3]!} stepCount={10} stepIndex={3} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause chapter" }));
    expect(handlers.onPause).toHaveBeenCalled();
    expect(screen.getByRole("progressbar", { name: "Walkthrough progress" })).toHaveAttribute("aria-valuenow", "4");
    rerender(<DemoWalkthroughControls {...handlers} autoplay playback="paused" elapsedMs={1_000} language="en" step={DEMO_STEPS[3]!} stepCount={10} stepIndex={3} />);
    fireEvent.click(screen.getByRole("button", { name: "Resume chapter" }));
    expect(handlers.onPlay).toHaveBeenCalled();
  });
});
