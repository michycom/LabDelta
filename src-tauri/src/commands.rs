use std::sync::Mutex;

use tauri::State;

use crate::domain::{Patient, PatientInput};
use crate::persistence::PatientRepository;

pub struct PatientStore(Mutex<PatientRepository>);

impl PatientStore {
    pub fn new(repository: PatientRepository) -> Self {
        Self(Mutex::new(repository))
    }

    fn repository(&self) -> Result<std::sync::MutexGuard<'_, PatientRepository>, String> {
        self.0
            .lock()
            .map_err(|_| "Patient persistence lock is unavailable".to_owned())
    }
}

#[tauri::command]
pub fn list_patients(store: State<'_, PatientStore>) -> Result<Vec<Patient>, String> {
    store
        .repository()?
        .list()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_patient(
    input: PatientInput,
    store: State<'_, PatientStore>,
) -> Result<Patient, String> {
    store
        .repository()?
        .create(input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_patient(
    id: String,
    input: PatientInput,
    store: State<'_, PatientStore>,
) -> Result<Patient, String> {
    store
        .repository()?
        .update(&id, input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_patient(id: String, store: State<'_, PatientStore>) -> Result<(), String> {
    store
        .repository()?
        .delete(&id)
        .map_err(|error| error.to_string())
}
