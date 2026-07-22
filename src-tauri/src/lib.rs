mod commands;
mod dashboard;
mod demo_fixtures;
mod demo_seed;
mod domain;
mod migrations;
mod native_menu;
mod persistence;
mod read_model;

use std::fs;
use std::io;

use commands::{
    get_dashboard, get_patient_details, list_confirmed_report_values, list_laboratory_reports,
    list_patients, list_reference_catalog_parameters, list_reference_sources, PatientStore,
};
use persistence::PatientRepository;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_directory = app.path().app_data_dir()?;
            fs::create_dir_all(&data_directory)?;
            let mut repository = PatientRepository::open(data_directory.join("labdelta.sqlite3"))
                .map_err(|error| io::Error::other(error.to_string()))?;
            demo_seed::apply(&mut repository)
                .map_err(|error| io::Error::other(error.to_string()))?;
            app.manage(PatientStore::new(repository));
            native_menu::install(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_patients,
            list_reference_sources,
            list_reference_catalog_parameters,
            get_patient_details,
            list_laboratory_reports,
            list_confirmed_report_values,
            get_dashboard,
            native_menu::update_native_menu
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
