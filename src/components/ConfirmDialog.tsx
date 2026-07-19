import type { Patient } from "../types";

export function ConfirmDialog({ patient, isDeleting, onCancel, onConfirm }: {
  patient: Patient;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return <div className="modal-backdrop"><section aria-labelledby="delete-patient-title" aria-modal="true" className="patient-modal confirm-dialog" role="dialog">
    <h2 id="delete-patient-title">Delete patient?</h2>
    <p><strong>{patient.displayName}</strong> will be permanently removed from this local LabDelta database.</p>
    <p>This operation is only performed after this confirmation.</p>
    <div className="modal-actions"><button disabled={isDeleting} type="button" onClick={onCancel}>Cancel</button><button className="danger" disabled={isDeleting} type="button" onClick={() => void onConfirm()}>{isDeleting ? "Deleting…" : "Delete patient"}</button></div>
  </section></div>;
}
