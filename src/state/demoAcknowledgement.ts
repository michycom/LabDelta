export const DEMO_ACKNOWLEDGEMENT_KEY = "labdelta.demoDisclaimer.v1.acknowledged";

export function hasAcknowledgedDemoDisclaimer(): boolean {
  try {
    return window.localStorage.getItem(DEMO_ACKNOWLEDGEMENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function storeDemoDisclaimerAcknowledgement(): void {
  try {
    window.localStorage.setItem(DEMO_ACKNOWLEDGEMENT_KEY, "true");
  } catch {
    // The acknowledgement remains valid for the current UI session only.
  }
}
