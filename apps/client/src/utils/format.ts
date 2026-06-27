import type { RiskStatus } from "@mantra4change/shared-types";

export function formatPercent(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = Number(m) - 1;
  return `${names[idx] ?? m} ${year}`;
}

export function formatMomDelta(delta: number | undefined): string | null {
  if (delta === undefined) return null;
  const pp = (delta * 100).toFixed(1);
  const sign = delta > 0 ? "+" : "";
  return `${sign}${pp} pp`;
}

export function riskClassName(status: RiskStatus): string {
  switch (status) {
    case "On Track":
      return "risk-on-track";
    case "Behind":
      return "risk-behind";
    case "At Risk":
      return "risk-at-risk";
    case "Critical":
      return "risk-critical";
    default:
      return "risk-critical";
  }
}
