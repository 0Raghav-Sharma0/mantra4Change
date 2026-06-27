import type { AiNarrativeResponse, MonthlyReviewSummary } from "@mantra4change/shared-types";

export function buildMonthlyReviewMarkdown(summary: MonthlyReviewSummary): string {
  const scopeParts = [
    summary.reportingMonth,
    summary.filters.district,
    summary.filters.block,
    summary.filters.grade ? `grade ${summary.filters.grade}` : undefined,
    summary.filters.subject,
  ].filter(Boolean);

  return [
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
    ...(summary.gaps.length ? summary.gaps.map((item) => `- ${item}`) : ["- No major gaps flagged."]),
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
  ].join("\n");
}

export function buildGrantReportMarkdown(input: {
  grantId: string;
  grantName: string;
  reportingMonth: string;
  narrative: AiNarrativeResponse;
}): string {
  return [
    `# Grant Report — ${input.grantName}`,
    "",
    `- Grant ID: ${input.grantId}`,
    `- Reporting month: ${input.reportingMonth}`,
    "",
    input.narrative.narrative,
  ].join("\n");
}

export function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
