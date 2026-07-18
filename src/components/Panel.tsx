import type { ReactNode } from "react";

export function Panel({ number, title, subtitle, children, className = "" }: { number: number; title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-title"><span className="step">{number}</span><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>{children}</section>;
}

