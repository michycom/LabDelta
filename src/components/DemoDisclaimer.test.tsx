import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as patientApi from "../api/patients";
import App from "../App";
import { DEMO_ACKNOWLEDGEMENT_KEY } from "../state/demoAcknowledgement";

vi.mock("../api/patients", () => ({
  getDashboard: vi.fn(),
  listPatients: vi.fn(),
  getPatientDetails: vi.fn(),
  listLaboratoryReports: vi.fn(),
  listConfirmedReportValues: vi.fn(),
  listReferenceSources: vi.fn(),
  listReferenceCatalogParameters: vi.fn()
}));

afterEach(cleanup);

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(patientApi.listPatients).mockResolvedValue([]);
  vi.mocked(patientApi.getDashboard).mockResolvedValue({ filter: "all", sortExplanation: "Deterministic", patients: [] });
  vi.mocked(patientApi.listReferenceSources).mockResolvedValue([]);
});

describe("demo disclaimer", () => {
  it("precedes the application and states the binding demo limitations", () => {
    render(<App />);

    expect(screen.getByRole("dialog", { name: "Notice before starting" })).toBeInTheDocument();
    expect(screen.getByText("LabDelta is a research and demonstration project. It is not clinically validated or released for medical use.")).toBeInTheDocument();
    expect(screen.getByText("The software must not be used for medical decisions.")).toBeInTheDocument();
    expect(screen.getByText("This notice and acknowledgement are not a regulatory review, certification, or approval.")).toBeInTheDocument();
    expect(screen.queryByText("Synthetic demo patients")).not.toBeInTheDocument();
    expect(patientApi.listPatients).not.toHaveBeenCalled();
  });

  it("stores only the local UI acknowledgement and keeps the demo marker visible", async () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge notice and open demo" }));

    expect(window.localStorage.getItem(DEMO_ACKNOWLEDGEMENT_KEY)).toBe("true");
    expect(screen.getByRole("status")).toHaveTextContent("Demo – synthetic test data only");
    expect(await screen.findByText("No approved demo patients match this filter.")).toBeInTheDocument();

    firstRender.unmount();
    render(<App />);
    expect(screen.queryByRole("dialog", { name: "Notice before starting" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Demo – synthetic test data only");
  });
});
