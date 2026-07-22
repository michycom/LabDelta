import { Activity, BarChart3, Database, FileInput, FileSearch, Files, History, Layers3, LayoutDashboard, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { AppSection } from "../types";
import { DemoBanner } from "./DemoDisclaimer";
import { useI18n } from "../i18n";

const navigation = [
  ["dashboard", LayoutDashboard, "dashboard"], ["analysis", BarChart3, "analysis"], ["patients", Users, "patients"], ["reports", Files, "reports"], ["profiles", Layers3, "profiles"], ["history", History, "history"], ["original", FileSearch, "originalDocument"], ["provenance", Database, "provenance"], ["import", FileInput, "import"]
] as const;

export function Shell({ children, activeSection, onNavigate, sidebarVisible }: { children: ReactNode; activeSection: AppSection; onNavigate: (section: AppSection) => void; sidebarVisible: boolean }) {
  const { t } = useI18n();
  return <div className={sidebarVisible ? "app-shell" : "app-shell sidebar-hidden"}>
    {sidebarVisible ? <aside className="sidebar">
      <div className="brand"><Activity aria-hidden="true" /><span>LabDelta</span></div>
      <nav aria-label={t("navLabel")}>{navigation.map(([key, Icon, section]) => <button className={section === activeSection ? "nav-item active" : "nav-item"} key={key} type="button" onClick={() => onNavigate(section)}><Icon size={18} />{t(key)}</button>)}</nav>
      <div className="privacy-note">⌾<span>{t("localPrivacy")}</span></div>
      <small>Version 0.1.0 · demo</small>
    </aside> : null}
    <main className="main-area"><DemoBanner />{children}</main>
  </div>;
}
