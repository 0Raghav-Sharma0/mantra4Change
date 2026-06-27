import type { MonthlyReviewSummary, ProgramReviewSummary, ProgramRisksResponse } from "@mantra4change/shared-types";

export function buildMonthlyReviewSummary(
  summary: ProgramReviewSummary,
  risks: ProgramRisksResponse,
): MonthlyReviewSummary {
  return {
    reportingMonth: summary.reportingMonth,
    filters: summary.filters,
    overallRiskStatus: risks.overallRiskStatus,
    achievements: summary.achievements,
    gaps: summary.gaps,
    monthOverMonthChanges: summary.monthOverMonthChanges,
    risks: risks.overall
      .filter((item) => item.indicator !== "composite")
      .map((item) => ({
        indicator: item.indicator,
        ratePercent: Math.round(item.rate * 1000) / 10,
        riskStatus: item.riskStatus,
        explanation: item.explanation,
      })),
    priorityDistricts: summary.priorityDistricts,
    priorityBlocks: summary.priorityBlocks,
    discussionPrompts: summary.discussionPoints,
  };
}

export function buildMonthlyReviewMarkdown(summary: MonthlyReviewSummary): string {
  const scopeParts = [
    summary.reportingMonth,
    summary.filters.district,
    summary.filters.block,
    summary.filters.grade ? `grade ${summary.filters.grade}` : undefined,
    summary.filters.subject,
  ].filter(Boolean);

  const lines = [
    `# Monthly Program Review — ${scopeParts.join(" / ") || "program-wide"}`,
    "",
    `**Overall risk:** ${summary.overallRiskStatus}`,
    "",
    "## Achievements",
    ...(summary.achievements.length
      ? summary.achievements.map((item) => `- ${item}`)
      : ["- None flagged for current thresholds."]),
    "",
    "## Gaps",
    ...(summary.gaps.length
      ? summary.gaps.map((item) => `- ${item}`)
      : ["- No major gaps flagged."]),
    "",
    "## Month-over-month changes",
    ...(summary.monthOverMonthChanges.length
      ? summary.monthOverMonthChanges.map((item) => `- ${item}`)
      : ["- No prior-month comparison available."]),
    "",
    "## Risks",
    ...summary.risks.map(
      (risk) => `- **${risk.indicator}** (${risk.ratePercent}%): ${risk.explanation}`,
    ),
    "",
    "## Priority districts",
    ...(summary.priorityDistricts.length
      ? summary.priorityDistricts.map((item) => `- ${item}`)
      : ["- None flagged"]),
    "",
    "## Priority blocks",
    ...(summary.priorityBlocks.length
      ? summary.priorityBlocks.map((item) => `- ${item}`)
      : ["- None flagged"]),
    "",
    "## Discussion prompts",
    ...summary.discussionPrompts.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}

export function buildGrantReportMarkdown(input: {
  grantId: string;
  grantName: string;
  reportingMonth: string;
  narrative: string;
  citedFacts: Array<{ id: string; label: string; value: string }>;
}): string {
  return [
    `# Grant Report — ${input.grantName}`,
    "",
    `- Grant ID: ${input.grantId}`,
    `- Reporting month: ${input.reportingMonth}`,
    "",
    input.narrative,
  ].join("\n");
}
