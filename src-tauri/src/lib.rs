mod commands;
mod demo_fixtures;
mod domain;
mod migrations;
mod persistence;

use std::fs;
use std::io;

use commands::{create_patient, delete_patient, list_patients, update_patient, PatientStore};
use persistence::PatientRepository;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            demo_fixtures::validate_embedded_fixtures()
                .map_err(|error| io::Error::other(error.to_string()))?;
            let data_directory = app.path().app_data_dir()?;
            fs::create_dir_all(&data_directory)?;
            let repository = PatientRepository::open(data_directory.join("labdelta.sqlite3"))
                .map_err(|error| io::Error::other(error.to_string()))?;
            app.manage(PatientStore::new(repository));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_patients,
            create_patient,
            update_patient,
            delete_patient
        ])
        .run(tauri::generate_context!())
        .expect("error while running LabDelta");
}

#[cfg(test)]
mod tests {
    #[test]
    fn package_name_is_stable() {
        assert_eq!(env!("CARGO_PKG_NAME"), "labdelta");
    }
}
