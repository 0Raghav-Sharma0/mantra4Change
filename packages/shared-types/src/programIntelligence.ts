import type { ReportingMonth } from "@mantra4change/shared-types";

export function getPreviousReportingMonth(month: ReportingMonth): ReportingMonth | null {
  const order: ReportingMonth[] = ["2025-07", "2025-08", "2025-09"];
  const index = order.indexOf(month);
  if (index <= 0) return null;
  return order[index - 1] ?? null;
}

export function getLatestReportingMonth(): ReportingMonth {
  return "2025-09";
}

export function explainRisk(metricLabel: string, rateDecimal: number): string {
  const pct = rateDecimal * 100;
  const pctText = pct.toFixed(1);

  if (pct >= 75) {
    return `${metricLabel} is ${pctText}%, classified as On Track (>= 75%).`;
  }
  if (pct >= 60) {
    return `${metricLabel} is ${pctText}%, classified as Behind (60% to below 75%).`;
  }
  if (pct >= 35) {
    return `${metricLabel} is ${pctText}%, classified as At Risk (35% to below 60%).`;
  }
  return `${metricLabel} is ${pctText}%, classified as Critical (below 35%).`;
}

export function rateToPercent(rateDecimal: number): number {
  return Math.round(rateDecimal * 10000) / 100;
}

export function computeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function computeMonthOverMonthDelta(
  current: number | undefined,
  previous: number | undefined,
): number | undefined {
  if (current === undefined || previous === undefined) return undefined;
  return Math.round((current - previous) * 10000) / 10000;
}
