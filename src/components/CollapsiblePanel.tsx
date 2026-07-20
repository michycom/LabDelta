import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface Props {
  storageKey: string;
  title: string;
  subtitle?: string;
  demoTarget: string;
  children: ReactNode;
  className?: string;
}

const storagePrefix = "labdelta.panel.collapsed.";

export function CollapsiblePanel({ storageKey, title, subtitle, demoTarget, children, className = "" }: Props) {
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(`${storagePrefix}${storageKey}`) === "true");
  const toggle = () => setCollapsed(current => {
    const next = !current;
    window.localStorage.setItem(`${storagePrefix}${storageKey}`, String(next));
    return next;
  });

  return <section className={`collapsible-panel ${collapsed ? "collapsed" : ""} ${className}`.trim()} data-demo-target={demoTarget}>
    <header className="collapsible-panel-header">
      <div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
      <button aria-expanded={!collapsed} aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`} onClick={toggle} type="button">{collapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}</button>
    </header>
    <div className="collapsible-panel-content" hidden={collapsed}>{children}</div>
  </section>;
}
