use tauri::menu::{Menu, MenuBuilder, MenuItem, MenuItemBuilder, Submenu, SubmenuBuilder};
use tauri::{App, Emitter, Manager};

pub(crate) const MENU_EVENT: &str = "native-menu-action";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) struct MenuEntrySpec {
    pub id: &'static str,
    pub label: &'static str,
    pub enabled: bool,
}

pub(crate) const ENTRIES: &[MenuEntrySpec] = &[
    entry("about", "About LabDelta…", true),
    entry("settings", "Settings…", false),
    entry("show-disclaimer", "Show Demo Disclaimer", true),
    entry("quit", "Quit LabDelta", true),
    entry("close-patient", "Close Patient", true),
    entry("import-demo-fixture", "Import Demo Fixture…", true),
    entry("print", "Print…", false),
    entry("find-patient", "Find Patient…", true),
    entry("next-patient", "Next Patient", true),
    entry("previous-patient", "Previous Patient", true),
    entry("next-report", "Next Report", true),
    entry("previous-report", "Previous Report", true),
    entry("show-provenance", "Show Provenance", true),
    entry("show-original-source", "Show Original Source", false),
    entry("view-dashboard", "Dashboard", true),
    entry("view-patients", "Patients", true),
    entry("view-reports", "Reports", true),
    entry("view-provenance", "Provenance", true),
    entry("view-import", "Import", true),
    entry("toggle-sidebar", "Toggle Sidebar", true),
    entry("enter-full-screen", "Enter Full Screen", true),
    entry("demo-play", "Play Demo", true),
    entry("demo-pause", "Pause Demo", true),
    entry("demo-stop", "Stop Demo", true),
    entry("demo-restart", "Restart Demo", true),
    entry("language-english", "English", true),
    entry("language-german", "Deutsch", true),
    entry("reset-demo-data", "Reset Demo Data", false),
    entry("help-limitations", "Demo Data and Limitations", true),
    entry("help-project-documentation", "Project Documentation", true),
    entry("help-synthetic-fixtures", "About Synthetic Fixtures", true),
];

const fn entry(id: &'static str, label: &'static str, enabled: bool) -> MenuEntrySpec {
    MenuEntrySpec { id, label, enabled }
}

pub(crate) fn install(app: &mut App) -> tauri::Result<()> {
    let menu = build(app)?;
    app.set_menu(menu)?;
    app.on_menu_event(|app, event| match event.id().as_ref() {
        "quit" => app.exit(0),
        "enter-full-screen" => {
            if let Some(window) = app.get_webview_window("main") {
                let fullscreen = window.is_fullscreen().unwrap_or(false);
                let _ = window.set_fullscreen(!fullscreen);
            }
        }
        id => {
            let _ = app.emit(MENU_EVENT, id);
        }
    });
    Ok(())
}

fn build(app: &App) -> tauri::Result<Menu<tauri::Wry>> {
    let labdelta = submenu(
        app,
        "LabDelta",
        &["about", "settings", "show-disclaimer", "quit"],
    )?;
    let file = submenu(
        app,
        "File",
        &["close-patient", "import-demo-fixture", "print"],
    )?;
    let patient = submenu(
        app,
        "Patient",
        &["find-patient", "next-patient", "previous-patient"],
    )?;
    let report = submenu(
        app,
        "Report",
        &[
            "next-report",
            "previous-report",
            "show-provenance",
            "show-original-source",
        ],
    )?;
    let view = submenu(
        app,
        "View",
        &[
            "view-dashboard",
            "view-patients",
            "view-reports",
            "view-provenance",
            "view-import",
            "toggle-sidebar",
            "enter-full-screen",
        ],
    )?;
    let language = submenu(app, "Language", &["language-english", "language-german"])?;
    let demo = SubmenuBuilder::new(app, "Demo")
        .items(&[
            &menu_item(app, "demo-play")?,
            &menu_item(app, "demo-pause")?,
            &menu_item(app, "demo-stop")?,
            &menu_item(app, "demo-restart")?,
            &language,
            &menu_item(app, "reset-demo-data")?,
        ])
        .build()?;
    let help = submenu(
        app,
        "Help",
        &[
            "help-limitations",
            "help-project-documentation",
            "help-synthetic-fixtures",
        ],
    )?;
    MenuBuilder::new(app)
        .items(&[&labdelta, &file, &patient, &report, &view, &demo, &help])
        .build()
}

fn submenu(app: &App, label: &str, ids: &[&str]) -> tauri::Result<Submenu<tauri::Wry>> {
    let items = ids
        .iter()
        .map(|id| menu_item(app, id))
        .collect::<tauri::Result<Vec<_>>>()?;
    let references = items
        .iter()
        .map(|item| item as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
        .collect::<Vec<_>>();
    SubmenuBuilder::new(app, label).items(&references).build()
}

fn menu_item(app: &App, id: &str) -> tauri::Result<MenuItem<tauri::Wry>> {
    let spec = ENTRIES
        .iter()
        .find(|entry| entry.id == id)
        .expect("known menu entry");
    MenuItemBuilder::with_id(spec.id, spec.label)
        .enabled(spec.enabled)
        .build(app)
}

#[cfg(test)]
mod tests {
    use super::ENTRIES;

    #[test]
    fn unavailable_actions_are_disabled() {
        for id in [
            "settings",
            "print",
            "show-original-source",
            "reset-demo-data",
        ] {
            assert!(
                !ENTRIES
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("entry")
                    .enabled,
                "{id} must remain disabled"
            );
        }
    }

    #[test]
    fn walkthrough_and_language_actions_are_enabled() {
        for id in [
            "demo-play",
            "demo-pause",
            "demo-stop",
            "demo-restart",
            "language-english",
            "language-german",
        ] {
            assert!(
                ENTRIES
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("entry")
                    .enabled,
                "{id} must be available for the walkthrough"
            );
        }
    }

    #[test]
    fn import_is_navigation_only_and_no_write_action_is_registered() {
        assert!(
            ENTRIES
                .iter()
                .find(|entry| entry.id == "import-demo-fixture")
                .expect("import info")
                .enabled
        );
        assert!(!ENTRIES.iter().any(|entry| entry.id.contains("write")
            || entry.id.contains("file-dialog")
            || entry.id.contains("delete")));
    }
}
