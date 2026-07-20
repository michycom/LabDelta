import type { MathematicalDirection, ReferenceStatus } from "./types";

export const UI_TERMINOLOGY = {
  referenceStatus: {
    within: "Within reference",
    above: "Above reference",
    below: "Below reference",
    notAssessable: "Not assessable"
  },
  attentionLevel: {
    normal: "Normal",
    notice: "Notice",
    attention: "Attention"
  },
  mathematicalChange: {
    higher: "Rising",
    lower: "Falling",
    equal: "Stable",
    noComparison: "No comparison"
  },
  changeMagnitude: {
    minor: "Minor",
    moderate: "Moderate",
    significant: "Significant"
  },
  additionalText: "Remark"
} as const;

export function referenceStatusLabel(status: ReferenceStatus): string {
  return UI_TERMINOLOGY.referenceStatus[status];
}

export function mathematicalChangeLabel(direction: MathematicalDirection): string {
  return UI_TERMINOLOGY.mathematicalChange[direction];
}
