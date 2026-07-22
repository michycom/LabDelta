use tauri::menu::{Menu, MenuBuilder, MenuItem, MenuItemBuilder, Submenu, SubmenuBuilder};
use tauri::{App, AppHandle, Emitter, Manager, Wry};

pub(crate) const MENU_EVENT: &str = "native-menu-action";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) struct MenuEntrySpec {
    pub id: &'static str,
    pub label: &'static str,
    pub enabled: bool,
}

pub(crate) const ENTRIES: &[MenuEntrySpec] = &[
    entry("about", "About LabDelta…", true),
    entry("settings", "Preferences…", true),
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
    entry("demo-contest", "Contest Demo (≈3 min)", true),
    entry("demo-full", "Full Walkthrough (≈8 min)", true),
    entry("demo-play", "▶ Play Demo", true),
    entry("demo-previous-step", "◀ Previous Step", true),
    entry("demo-next-step", "▶ Next Step", true),
    entry("demo-pause", "⏸ Pause", true),
    entry("demo-stop", "⏹ Stop", true),
    entry("demo-restart", "Restart Demo", true),
    entry("toggle-demo-visibility", "Hide Demo", true),
    entry("language-english", "English", true),
    entry("language-german", "Deutsch", true),
    entry("language-chinese", "中文（简体）", true),
    entry("reset-demo-data", "Reset Demo Data", false),
    entry("help-limitations", "Demo Data and Limitations", true),
    entry("help-project-documentation", "Project Documentation", true),
    entry("help-synthetic-fixtures", "About Synthetic Fixtures", true),
];

const fn entry(id: &'static str, label: &'static str, enabled: bool) -> MenuEntrySpec {
    MenuEntrySpec { id, label, enabled }
}

pub(crate) fn install(app: &mut App) -> tauri::Result<()> {
    let menu = build(app.handle(), "en", true)?;
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

#[tauri::command]
pub(crate) fn update_native_menu(
    app: AppHandle<Wry>,
    language: String,
    demo_visible: bool,
) -> Result<(), String> {
    let menu = build(&app, &language, demo_visible).map_err(|error| error.to_string())?;
    app.set_menu(menu).map_err(|error| error.to_string())?;
    Ok(())
}

fn label(language: &str, en: &str, de: &str, zh: &str) -> String {
    match language {
        "de" => de,
        "zh-CN" => zh,
        _ => en,
    }
    .to_owned()
}

fn build(app: &AppHandle<Wry>, language: &str, demo_visible: bool) -> tauri::Result<Menu<Wry>> {
    let labdelta = submenu(
        app,
        &label(language, "LabDelta", "LabDelta", "LabDelta"),
        language,
        &["about", "settings", "show-disclaimer", "quit"],
    )?;
    let file = submenu(
        app,
        &label(language, "File", "Ablage", "文件"),
        language,
        &["close-patient", "import-demo-fixture", "print"],
    )?;
    let patient = submenu(
        app,
        &label(language, "Patient", "Patient", "患者"),
        language,
        &["find-patient", "next-patient", "previous-patient"],
    )?;
    let report = submenu(
        app,
        &label(language, "Report", "Bericht", "报告"),
        language,
        &[
            "next-report",
            "previous-report",
            "show-provenance",
            "show-original-source",
        ],
    )?;
    let view = submenu(
        app,
        &label(language, "View", "Darstellung", "视图"),
        language,
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
    let language_menu = submenu(
        app,
        &label(language, "Language", "Sprache", "语言"),
        language,
        &["language-english", "language-german", "language-chinese"],
    )?;
    let demo = SubmenuBuilder::new(app, label(language, "Demo", "Demo", "演示"))
        .items(&[
            &menu_item(app, language, "demo-contest")?,
            &menu_item(app, language, "demo-full")?,
        ])
        .separator()
        .items(&[
            &menu_item(app, language, "demo-play")?,
            &menu_item(app, language, "demo-previous-step")?,
            &menu_item(app, language, "demo-next-step")?,
            &menu_item(app, language, "demo-pause")?,
            &menu_item(app, language, "demo-stop")?,
        ])
        .separator()
        .item(&menu_item(app, language, "demo-restart")?)
        .item(
            &MenuItemBuilder::with_id(
                "toggle-demo-visibility",
                label(
                    language,
                    if demo_visible {
                        "Hide Demo"
                    } else {
                        "Show Demo"
                    },
                    if demo_visible {
                        "Demo ausblenden"
                    } else {
                        "Demo einblenden"
                    },
                    if demo_visible {
                        "隐藏演示"
                    } else {
                        "显示演示"
                    },
                ),
            )
            .accelerator("CmdOrCtrl+Shift+D")
            .build(app)?,
        )
        .separator()
        .item(&language_menu)
        .item(&menu_item(app, language, "reset-demo-data")?)
        .build()?;
    let help = submenu(
        app,
        &label(language, "Help", "Hilfe", "帮助"),
        language,
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

fn submenu(
    app: &AppHandle<Wry>,
    label: &str,
    language: &str,
    ids: &[&str],
) -> tauri::Result<Submenu<Wry>> {
    let items = ids
        .iter()
        .map(|id| menu_item(app, language, id))
        .collect::<tauri::Result<Vec<_>>>()?;
    let references = items
        .iter()
        .map(|item| item as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
        .collect::<Vec<_>>();
    SubmenuBuilder::new(app, label).items(&references).build()
}

fn menu_item(app: &AppHandle<Wry>, language: &str, id: &str) -> tauri::Result<MenuItem<Wry>> {
    let spec = ENTRIES
        .iter()
        .find(|entry| entry.id == id)
        .expect("known menu entry");
    let localized = match spec.id {
        "about" => label(
            language,
            "About LabDelta…",
            "Über LabDelta…",
            "关于 LabDelta…",
        ),
        "settings" => label(language, "Preferences…", "Einstellungen…", "偏好设置…"),
        "show-disclaimer" => label(
            language,
            "Show Demo Disclaimer",
            "Demo-Hinweis anzeigen",
            "显示演示免责声明",
        ),
        "quit" => label(
            language,
            "Quit LabDelta",
            "LabDelta beenden",
            "退出 LabDelta",
        ),
        "close-patient" => label(language, "Close Patient", "Patient schließen", "关闭患者"),
        "import-demo-fixture" => label(
            language,
            "Import Demo Fixture…",
            "Demo-Fixture importieren…",
            "导入演示数据…",
        ),
        "print" => label(language, "Print…", "Drucken…", "打印…"),
        "find-patient" => label(language, "Find Patient…", "Patient suchen…", "查找患者…"),
        "next-patient" => label(language, "Next Patient", "Nächster Patient", "下一位患者"),
        "previous-patient" => label(
            language,
            "Previous Patient",
            "Vorheriger Patient",
            "上一位患者",
        ),
        "next-report" => label(language, "Next Report", "Nächster Bericht", "下一份报告"),
        "previous-report" => label(
            language,
            "Previous Report",
            "Vorheriger Bericht",
            "上一份报告",
        ),
        "show-provenance" => label(
            language,
            "Show Provenance",
            "Provenienz anzeigen",
            "显示来源追踪",
        ),
        "show-original-source" => label(
            language,
            "Show Original Source",
            "Originalquelle anzeigen",
            "显示原始来源",
        ),
        "view-patients" => label(language, "Patients", "Patienten", "患者"),
        "view-dashboard" => label(language, "Dashboard", "Dashboard", "仪表板"),
        "view-reports" => label(language, "Reports", "Berichte", "报告"),
        "view-provenance" => label(language, "Provenance", "Provenienz", "来源追踪"),
        "view-import" => label(language, "Import", "Import", "导入"),
        "toggle-sidebar" => label(
            language,
            "Toggle Sidebar",
            "Seitenleiste umschalten",
            "切换侧边栏",
        ),
        "demo-contest" => label(
            language,
            "Contest Demo (≈3 min)",
            "Contest-Demo (≈3 Min.)",
            "竞赛演示（约3分钟）",
        ),
        "demo-full" => label(
            language,
            "Full Walkthrough (≈8 min)",
            "Vollständiger Rundgang (≈8 Min.)",
            "完整导览（约8分钟）",
        ),
        "enter-full-screen" => label(language, "Enter Full Screen", "Vollbildmodus", "进入全屏"),
        "demo-play" => label(language, "▶ Play Demo", "▶ Demo abspielen", "▶ 播放演示"),
        "demo-previous-step" => label(
            language,
            "◀ Previous Chapter",
            "◀ Vorheriges Kapitel",
            "◀ 上一章节",
        ),
        "demo-next-step" => label(
            language,
            "▶ Next Chapter",
            "▶ Nächstes Kapitel",
            "▶ 下一章节",
        ),
        "demo-pause" => label(language, "⏸ Pause", "⏸ Pausieren", "⏸ 暂停"),
        "demo-stop" => label(language, "⏹ Stop", "⏹ Stoppen", "⏹ 停止"),
        "demo-restart" => label(
            language,
            "Replay Chapter",
            "Kapitel wiederholen",
            "重播章节",
        ),
        "reset-demo-data" => label(
            language,
            "Reset Demo Data",
            "Demodaten zurücksetzen",
            "重置演示数据",
        ),
        "help-limitations" => label(
            language,
            "Demo Data and Limitations",
            "Demodaten und Einschränkungen",
            "演示数据与限制",
        ),
        "help-project-documentation" => label(
            language,
            "Project Documentation",
            "Projektdokumentation",
            "项目文档",
        ),
        "help-synthetic-fixtures" => label(
            language,
            "About Synthetic Fixtures",
            "Über synthetische Fixtures",
            "关于合成数据",
        ),
        "language-chinese" => "中文（简体）".to_owned(),
        _ => spec.label.to_owned(),
    };
    MenuItemBuilder::with_id(spec.id, localized)
        .enabled(spec.enabled)
        .build(app)
}

#[cfg(test)]
mod tests {
    use super::{label, ENTRIES};

    #[test]
    fn unavailable_actions_are_disabled() {
        for id in ["print", "show-original-source", "reset-demo-data"] {
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
            "demo-contest",
            "demo-full",
            "demo-play",
            "demo-previous-step",
            "demo-next-step",
            "demo-pause",
            "demo-stop",
            "demo-restart",
            "language-english",
            "language-german",
            "language-chinese",
            "toggle-demo-visibility",
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

    #[test]
    fn native_labels_cover_all_interface_languages() {
        assert_eq!(
            label("en", "Hide Demo", "Demo ausblenden", "隐藏演示"),
            "Hide Demo"
        );
        assert_eq!(
            label("de", "Hide Demo", "Demo ausblenden", "隐藏演示"),
            "Demo ausblenden"
        );
        assert_eq!(
            label("zh-CN", "Hide Demo", "Demo ausblenden", "隐藏演示"),
            "隐藏演示"
        );
        assert!(ENTRIES
            .iter()
            .any(|entry| entry.id == "language-chinese" && entry.enabled));
        assert!(ENTRIES
            .iter()
            .any(|entry| entry.id == "toggle-demo-visibility" && entry.enabled));
    }
}
