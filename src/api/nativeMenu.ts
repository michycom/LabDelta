import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AppSection } from "../types";

export const NATIVE_MENU_EVENT = "native-menu-action";

export function sectionForMenuAction(action: string): AppSection | null {
  const sections: Record<string, AppSection> = {
    "view-dashboard": "dashboard",
    "view-patients": "patients",
    "find-patient": "patients",
    "view-reports": "reports",
    "view-provenance": "provenance",
    "show-provenance": "provenance",
    "view-import": "import",
    "import-demo-fixture": "import",
    about: "about",
    "help-limitations": "limitations",
    "help-project-documentation": "documentation",
    "help-synthetic-fixtures": "fixtures"
  };
  return sections[action] ?? null;
}

export function subscribeNativeMenu(handler: (action: string) => void): Promise<UnlistenFn> {
  if (!("__TAURI_INTERNALS__" in window)) return Promise.resolve(() => undefined);
  return listen<string>(NATIVE_MENU_EVENT, event => handler(event.payload));
}
