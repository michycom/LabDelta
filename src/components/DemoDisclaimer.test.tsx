import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as patientApi from "../api/patients";
import App from "../App";
import { DEMO_ACKNOWLEDGEMENT_KEY } from "../state/demoAcknowledgement";

vi.mock("../api/patients", () => ({
  listPatients: vi.fn(),
  getPatientDetails: vi.fn(),
  listLaboratoryReports: vi.fn(),
  listConfirmedReportValues: vi.fn()
}));

afterEach(cleanup);

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(patientApi.listPatients).mockResolvedValue([]);
});

describe("demo disclaimer", () => {
  it("precedes the application and states the binding demo limitations", () => {
    render(<App />);

    expect(screen.getByRole("dialog", { name: "Hinweis vor dem Start" })).toBeInTheDocument();
    expect(screen.getByText("LabDelta ist ein Forschungs- und Demonstrationsprojekt. Es ist nicht klinisch validiert und nicht für medizinische Nutzung freigegeben.")).toBeInTheDocument();
    expect(screen.getByText("Die Software darf nicht für medizinische Entscheidungen genutzt werden.")).toBeInTheDocument();
    expect(screen.getByText("Dieser Hinweis und seine Kenntnisnahme sind keine regulatorische Prüfung, Zertifizierung oder Freigabe.")).toBeInTheDocument();
    expect(screen.queryByText("Synthetic demo patients")).not.toBeInTheDocument();
    expect(patientApi.listPatients).not.toHaveBeenCalled();
  });

  it("stores only the local UI acknowledgement and keeps the demo marker visible", async () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Hinweis zur Kenntnis nehmen und Demo öffnen" }));

    expect(window.localStorage.getItem(DEMO_ACKNOWLEDGEMENT_KEY)).toBe("true");
    expect(screen.getByRole("status")).toHaveTextContent("Demo – ausschließlich synthetische Testdaten");
    expect(await screen.findByText("No approved demo patients are stored.")).toBeInTheDocument();

    firstRender.unmount();
    render(<App />);
    expect(screen.queryByRole("dialog", { name: "Hinweis vor dem Start" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Demo – ausschließlich synthetische Testdaten");
  });
});
