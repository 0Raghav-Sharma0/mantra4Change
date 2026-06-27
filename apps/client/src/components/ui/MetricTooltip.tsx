import type { ReactNode } from "react";

export function MetricTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="metric-tooltip">
      <button type="button" className="metric-tooltip-trigger" aria-label={`Explain ${label}`}>
        ?
      </button>
      <span role="tooltip" className="metric-tooltip-content">
        {children}
      </span>
    </span>
  );
}
