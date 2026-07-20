import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CollapsiblePanel } from "./CollapsiblePanel";

describe("collapsible panels", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("collapses without unmounting content and remembers local state", () => {
    const first = render(<CollapsiblePanel demoTarget="test-panel" storageKey="test" title="Test panel"><span>SQLite-backed content</span></CollapsiblePanel>);
    const button = screen.getByRole("button", { name: "Collapse Test panel" });
    fireEvent.click(button);
    expect(screen.getByText("SQLite-backed content")).not.toBeVisible();
    expect(window.localStorage.getItem("labdelta.panel.collapsed.test")).toBe("true");

    first.unmount();
    render(<CollapsiblePanel demoTarget="test-panel" storageKey="test" title="Test panel"><span>SQLite-backed content</span></CollapsiblePanel>);
    expect(screen.getByRole("button", { name: "Expand Test panel" })).toHaveAttribute("aria-expanded", "false");
  });
});
