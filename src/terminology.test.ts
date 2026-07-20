import { describe, expect, it } from "vitest";
import { mathematicalChangeLabel, referenceStatusLabel, UI_TERMINOLOGY } from "./terminology";

describe("neutral UI terminology", () => {
  it("centralizes the approved reference and mathematical labels", () => {
    expect(referenceStatusLabel("within")).toBe("Within reference");
    expect(referenceStatusLabel("above")).toBe("Above reference");
    expect(referenceStatusLabel("below")).toBe("Below reference");
    expect(referenceStatusLabel("notAssessable")).toBe("Not assessable");
    expect(mathematicalChangeLabel("higher")).toBe("Rising");
    expect(mathematicalChangeLabel("lower")).toBe("Falling");
    expect(mathematicalChangeLabel("equal")).toBe("Stable");
    expect(mathematicalChangeLabel("noComparison")).toBe("No comparison");
  });

  it("contains the complete approved vocabulary without conclusion-oriented labels", () => {
    const labels = JSON.stringify(UI_TERMINOLOGY).toLowerCase();
    for (const forbidden of ["healthy", "unhealthy", "better", "worse", "improved", "deteriorated", "optimal", "normal value", "ideal value"]) {
      expect(labels).not.toContain(forbidden);
    }
    expect(Object.values(UI_TERMINOLOGY.attentionLevel)).toEqual(["Normal", "Notice", "Attention"]);
    expect(Object.values(UI_TERMINOLOGY.changeMagnitude)).toEqual(["Minor", "Moderate", "Significant"]);
    expect(UI_TERMINOLOGY.additionalText).toBe("Remark");
  });
});
