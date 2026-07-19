import { Activity, LayoutDashboard, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { AppSection } from "../types";
import { DemoBanner } from "./DemoDisclaimer";

const navigation = [
  ["Demo data", LayoutDashboard, "dashboard"],
  ["Patients", Users, "patients"]
] as const;

export function Shell({ children, activeSection, onNavigate }: { children: ReactNode; activeSection: AppSection; onNavigate: (section: AppSection) => void }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><Activity aria-hidden="true" /><span>LabDelta</span></div>
      <nav aria-label="Primary navigation">{navigation.map(([label, Icon, section]) => <button className={section === activeSection ? "nav-item active" : "nav-item"} key={label} type="button" onClick={() => onNavigate(section)}><Icon size={18} />{label}</button>)}</nav>
      <div className="privacy-note">⌾<span>Data remains<br />local on this device.</span></div>
      <small>Version 0.1.0 · demo</small>
    </aside>
    <main className="main-area"><DemoBanner />{children}</main>
  </div>;
}
