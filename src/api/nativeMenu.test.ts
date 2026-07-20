import { describe, expect, it } from "vitest";
import { sectionForMenuAction } from "./nativeMenu";

describe("native menu navigation", () => {
  it("routes active navigation and information actions deterministically", () => {
    expect(sectionForMenuAction("view-dashboard")).toBe("dashboard");
    expect(sectionForMenuAction("find-patient")).toBe("patients");
    expect(sectionForMenuAction("view-reports")).toBe("reports");
    expect(sectionForMenuAction("show-provenance")).toBe("provenance");
    expect(sectionForMenuAction("import-demo-fixture")).toBe("import");
    expect(sectionForMenuAction("help-synthetic-fixtures")).toBe("fixtures");
    expect(sectionForMenuAction("demo-play")).toBeNull();
  });
});
