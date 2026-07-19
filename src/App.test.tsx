import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as patientApi from "./api/patients";
import App from "./App";
import type { Patient } from "./types";

vi.mock("./api/patients", () => ({
  listPatients: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn()
}));

const patient: Patient = {
  id: "84ab1641-1359-4c26-9983-6fc6b8746b95",
  displayName: "Mara Example",
  dateOfBirth: "1984-06-12",
  sexReferenceContext: "female",
  externalIdentifier: "SYNTH-001",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z"
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(patientApi.listPatients).mockResolvedValue([patient]);
  vi.mocked(patientApi.createPatient).mockImplementation(async input => ({
    ...patient,
    ...input,
    id: "6fc8f86b-8079-44ba-9242-3f597592aeca"
  }));
  vi.mocked(patientApi.updatePatient).mockImplementation(async (id, input) => ({
    ...patient,
    ...input,
    id,
    updatedAt: "2026-07-19T01:00:00.000Z"
  }));
  vi.mocked(patientApi.deletePatient).mockResolvedValue();
});

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

  it("loads and selects a persisted patient", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Quick selection — no patient selected"));
    expect(await screen.findByText("Mara Example")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getByRole("button", { name: `Selected patient Mara Example ${patient.id}` })).toHaveTextContent(patient.id);
  });

  it("creates and edits a patient through the local patient UI", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Patients" }));
    await screen.findByText("Mara Example");
    fireEvent.click(screen.getByRole("button", { name: "New patient" }));

    fireEvent.change(screen.getByLabelText("Patient name"), { target: { value: "New Patient" } });
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-02-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Save patient" }));

    await waitFor(() => expect(patientApi.createPatient).toHaveBeenCalledWith({
      displayName: "New Patient",
      dateOfBirth: "1990-02-03",
      sexReferenceContext: null,
      externalIdentifier: null
    }));
    expect(await screen.findByRole("button", { name: "Edit New Patient" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit New Patient" }));
    fireEvent.change(screen.getByLabelText("Patient name"), { target: { value: "Updated Patient" } });
    fireEvent.click(screen.getByRole("button", { name: "Save patient" }));

    await waitFor(() => expect(patientApi.updatePatient).toHaveBeenCalledWith(
      "6fc8f86b-8079-44ba-9242-3f597592aeca",
      expect.objectContaining({ displayName: "Updated Patient" })
    ));
    expect(await screen.findByRole("button", { name: "Edit Updated Patient" })).toBeInTheDocument();
  });

  it("validates required fields before creating a patient", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Patients" }));
    await screen.findByText("Mara Example");
    fireEvent.click(screen.getByRole("button", { name: "New patient" }));
    fireEvent.click(screen.getByRole("button", { name: "Save patient" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Patient name is required.");
    expect(patientApi.createPatient).not.toHaveBeenCalled();
  });

  it("deletes a patient only after explicit confirmation", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Patients" }));
    await screen.findByText("Mara Example");
    fireEvent.click(screen.getByRole("button", { name: "Delete Mara Example" }));

    expect(patientApi.deletePatient).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Delete patient?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete patient" }));

    await waitFor(() => expect(patientApi.deletePatient).toHaveBeenCalledWith(patient.id));
    await waitFor(() => expect(screen.queryByText("Mara Example")).not.toBeInTheDocument());
  });
});
