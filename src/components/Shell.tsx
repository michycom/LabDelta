import { Activity, BarChart3, FileText, FlaskConical, HelpCircle, LayoutDashboard, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  ["Dashboard", LayoutDashboard], ["Patients", Users], ["Laboratory reports", FileText],
  ["Comparisons", BarChart3], ["Laboratory profiles", FlaskConical], ["Settings", Settings], ["About LabDelta", HelpCircle]
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><Activity aria-hidden="true" /><span>LabDelta</span></div>
      <nav aria-label="Primary navigation">{navigation.map(([label, Icon], index) => <button className={index === 0 ? "nav-item active" : "nav-item"} key={label} type="button"><Icon size={18} />{label}</button>)}</nav>
      <div className="privacy-note">⌾<span>Data remains<br />local on this device.</span></div>
      <small>Version 0.1.0</small>
    </aside>
    <main className="main-area">{children}</main>
  </div>;
}

