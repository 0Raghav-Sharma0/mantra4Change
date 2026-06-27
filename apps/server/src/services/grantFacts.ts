import type {
  CitedFact,
  GrantEvidenceFact,
  GrantFactsResponse,
  GrantFinanceLineFact,
  GrantMilestoneFact,
  GrantPerformanceFacts,
  ReportingMonth,
} from "@mantra4change/shared-types";
import { parseReportingMonth } from "@mantra4change/shared-types";

export interface RawGrantPerformance {
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: ReportingMonth;
  periodStart: Date;
  periodEnd: Date;
  periodEndDate: Date;
  reportDueDate: Date;
  reportStatus: string;
  coveredDistricts: string[];
  sampledSchoolRecords: number;
  schoolsCompletedPbl: number;
  pblCompletionRate: number;
  schoolsWithEvidence: number;
  evidenceSubmissionRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: GrantPerformanceFacts["riskStatus"];
  milestoneSummary: string;
}

export interface RawGrantFinance {
  budgetLine: string;
  approvedBudgetUnits: number;
  monthlyUtilizedUnits: number;
  cumulativeUtilizedUnits: number;
  cumulativeUtilizationRate: number;
  financeNote: string;
}

export interface RawEvidenceMedia {
  recordId: string;
  recordType: string;
  grantId: string;
  donor: string;
  reportingMonth: ReportingMonth;
  district: string;
  title: string;
  summaryOrCaption: string;
  fileName: string;
  relativePath: string;
  usageNote: string;
}

export function parseMilestoneSummary(summary: string): GrantMilestoneFact[] {
  if (!summary.trim()) return [];

  return summary.split("|").map((part, index) => {
    const trimmed = part.trim();
    const match = /^(.+?):\s*(.+?)\s*\((.+)\)$/.exec(trimmed);
    if (!match) {
      return {
        label: `Milestone ${index + 1}`,
        status: trimmed,
        owner: "Unassigned",
      };
    }
    return {
      label: match[1]?.trim() ?? `Milestone ${index + 1}`,
      status: match[2]?.trim() ?? "Unknown",
      owner: match[3]?.trim() ?? "Unassigned",
    };
  });
}

export function buildEvidenceImageUrl(fileName: string, basePath = "/evidence"): string {
  return `${basePath}/${encodeURIComponent(fileName)}`;
}

export function linkEvidenceRecords(
  records: RawEvidenceMedia[],
  imageBasePath = "/evidence",
): GrantEvidenceFact[] {
  return records.map((record) => ({
    recordId: record.recordId,
    recordType: record.recordType,
    grantId: record.grantId,
    donor: record.donor,
    reportingMonth: record.reportingMonth,
    district: record.district,
    title: record.title,
    summaryOrCaption: record.summaryOrCaption,
    fileName: record.fileName,
    relativePath: record.relativePath,
    usageNote: record.usageNote,
    imageUrl: buildEvidenceImageUrl(record.fileName, imageBasePath),
  }));
}

export function mapFinanceLines(rows: RawGrantFinance[]): GrantFinanceLineFact[] {
  return rows.map((row) => ({
    budgetLine: row.budgetLine,
    approvedBudgetUnits: row.approvedBudgetUnits,
    monthlyUtilizedUnits: row.monthlyUtilizedUnits,
    cumulativeUtilizedUnits: row.cumulativeUtilizedUnits,
    cumulativeUtilizationRate: row.cumulativeUtilizationRate,
    financeNote: row.financeNote,
  }));
}

export function computeAggregateFinanceUtilization(finance: GrantFinanceLineFact[]): number {
  if (finance.length === 0) return 0;
  const totalApproved = finance.reduce((sum, line) => sum + line.approvedBudgetUnits, 0);
  const totalCumulative = finance.reduce((sum, line) => sum + line.cumulativeUtilizedUnits, 0);
  if (totalApproved <= 0) return 0;
  return totalCumulative / totalApproved;
}

export function assembleGrantFacts(input: {
  performance: RawGrantPerformance;
  finance: RawGrantFinance[];
  evidence: RawEvidenceMedia[];
  imageBasePath?: string;
}): GrantFactsResponse {
  const finance = mapFinanceLines(input.finance);
  const evidence = linkEvidenceRecords(input.evidence, input.imageBasePath);

  return {
    grantId: input.performance.grantId,
    grantName: input.performance.grantName,
    donor: input.performance.donor,
    reportingMonth: input.performance.reportingMonth,
    periodStart: input.performance.periodStart.toISOString().slice(0, 10),
    periodEnd: input.performance.periodEnd.toISOString().slice(0, 10),
    periodEndDate: input.performance.periodEndDate.toISOString().slice(0, 10),
    reportDueDate: input.performance.reportDueDate.toISOString().slice(0, 10),
    reportStatus: input.performance.reportStatus,
    coveredDistricts: input.performance.coveredDistricts,
    performance: {
      sampledSchoolRecords: input.performance.sampledSchoolRecords,
      schoolsCompletedPbl: input.performance.schoolsCompletedPbl,
      pblCompletionRate: input.performance.pblCompletionRate,
      schoolsWithEvidence: input.performance.schoolsWithEvidence,
      evidenceSubmissionRate: input.performance.evidenceSubmissionRate,
      totalEnrollment: input.performance.totalEnrollment,
      totalAttendance: input.performance.totalAttendance,
      attendanceRate: input.performance.attendanceRate,
      riskStatus: input.performance.riskStatus,
    },
    finance,
    milestones: parseMilestoneSummary(input.performance.milestoneSummary),
    evidence,
    aggregateFinanceUtilization: computeAggregateFinanceUtilization(finance),
  };
}

export function formatRatePercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function buildCitedFacts(facts: GrantFactsResponse): CitedFact[] {
  const cited: CitedFact[] = [
    {
      id: "perf-pbl-completion",
      label: "PBL completion rate",
      value: formatRatePercent(facts.performance.pblCompletionRate),
      source: "performance",
    },
    {
      id: "perf-evidence-submission",
      label: "Evidence submission rate",
      value: formatRatePercent(facts.performance.evidenceSubmissionRate),
      source: "performance",
    },
    {
      id: "perf-attendance",
      label: "Attendance rate",
      value: formatRatePercent(facts.performance.attendanceRate),
      source: "performance",
    },
    {
      id: "perf-risk-status",
      label: "Program risk status",
      value: facts.performance.riskStatus,
      source: "performance",
    },
    {
      id: "perf-schools-completed",
      label: "Schools completed PBL",
      value: String(facts.performance.schoolsCompletedPbl),
      source: "performance",
    },
    {
      id: "report-status",
      label: "Report status",
      value: facts.reportStatus,
      source: "milestone",
    },
    {
      id: "finance-aggregate-utilization",
      label: "Aggregate finance utilization",
      value: formatRatePercent(facts.aggregateFinanceUtilization),
      source: "finance",
    },
  ];

  for (const line of facts.finance) {
    cited.push({
      id: `finance-${line.budgetLine.toLowerCase().replace(/\s+/g, "-")}`,
      label: `${line.budgetLine} utilization`,
      value: formatRatePercent(line.cumulativeUtilizationRate),
      source: "finance",
    });
  }

  for (const milestone of facts.milestones) {
    cited.push({
      id: `milestone-${milestone.label.toLowerCase().replace(/\s+/g, "-")}`,
      label: milestone.label,
      value: `${milestone.status} (${milestone.owner})`,
      source: "milestone",
    });
  }

  for (const item of facts.evidence) {
    cited.push({
      id: `evidence-${item.recordId}`,
      label: item.title,
      value: `${item.recordId} · ${item.recordType} · ${item.district}`,
      source: "evidence",
    });
  }

  return cited;
}

export function buildDeterministicGrantNarrative(facts: GrantFactsResponse): string {
  const p = facts.performance;
  const financeLines = facts.finance
    .map(
      (line) =>
        `- ${line.budgetLine}: ${formatRatePercent(line.cumulativeUtilizationRate)} cumulative utilization (${line.financeNote})`,
    )
    .join("\n");

  const milestoneLines = facts.milestones
    .map((m) => `- ${m.label}: ${m.status} (${m.owner})`)
    .join("\n");

  const evidenceLines =
    facts.evidence.length > 0
      ? facts.evidence
          .map((e) => `- [${e.recordId}] ${e.title}: ${e.summaryOrCaption}`)
          .join("\n")
      : "- No linked evidence records for this grant and month.";

  return [
    `Grant Report Section — ${facts.grantName}`,
    `Reporting month: ${facts.reportingMonth} | Grant ID: ${facts.grantId} | Donor: ${facts.donor}`,
    `Report status: ${facts.reportStatus} | Due date: ${facts.reportDueDate}`,
    `Covered districts: ${facts.coveredDistricts.join("; ")}`,
    "",
    "Performance summary (computed from grant performance data):",
    `- PBL completion: ${formatRatePercent(p.pblCompletionRate)} (${p.schoolsCompletedPbl} of ${p.sampledSchoolRecords} sampled schools)`,
    `- Evidence submission: ${formatRatePercent(p.evidenceSubmissionRate)} (${p.schoolsWithEvidence} schools)`,
    `- Attendance: ${formatRatePercent(p.attendanceRate)} across ${p.totalEnrollment.toLocaleString()} enrolled students`,
    `- Program risk status: ${p.riskStatus}`,
    "",
    "Finance utilization by budget line:",
    financeLines || "- No finance rows for this grant and month.",
    "",
    `Aggregate finance utilization: ${formatRatePercent(facts.aggregateFinanceUtilization)}`,
    "",
    "Milestone summary:",
    milestoneLines || "- No milestones recorded.",
    "",
    "Linked evidence and media:",
    evidenceLines,
  ].join("\n");
}

export function assertValidGrantMonth(month: string): asserts month is ReportingMonth {
  if (!parseReportingMonth(month)) {
    throw new Error(`Invalid reporting month: ${month}`);
  }
}
