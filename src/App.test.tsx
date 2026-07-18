import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(cleanup);

describe("LabDelta Stage 1 shell", () => {
  it("renders the required data-driven views", () => {
    render(<App />);
    expect(screen.getByText("Dashboard — notable changes")).toBeInTheDocument();
    expect(screen.getByText("Patient detail & comparison")).toBeInTheDocument();
    expect(screen.getByText("Laboratory profile overview")).toBeInTheDocument();
    expect(screen.getByText("Original laboratory report view")).toBeInTheDocument();
    expect(screen.getByText("Import dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Müller, Anna").length).toBeGreaterThan(0);
  });

  it("selects the synthetic patient from the quick selector", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Quick selection — no patient selected"));
    expect(screen.getAllByText("Müller, Anna").length).toBeGreaterThan(1);
  });
});
