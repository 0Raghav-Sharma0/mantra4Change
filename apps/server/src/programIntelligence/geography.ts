import type {
  DashboardFilters,
  GeographyPerformance,
  GeographyPerformanceResponse,
  GeographyRiskResult,
  ProgramRisksResponse,
  ReportingMonth,
  RiskStatus,
} from "@mantra4change/shared-types";
import {
  classifyRiskFromRate,
  explainRisk,
  getPreviousReportingMonth,
} from "@mantra4change/shared-types";
import type { SchoolRecord } from "./filters.js";
import { filterSchoolRecords } from "./filters.js";
import {
  aggregateAttendance,
  aggregateEvidence,
  aggregateParticipation,
} from "./metrics.js";
import {
  buildDashboardMetrics,
  buildOverallRiskIndicators,
  buildRiskIndicator,
  compositeRate,
  worstRiskStatus,
} from "./riskEngine.js";

function buildGeographyPerformance(
  records: SchoolRecord[],
  name: string,
  level: "district" | "block",
  district: string | undefined,
  grade?: string,
  subject?: string,
): GeographyPerformance {
  const participation = aggregateParticipation(records);
  const evidence = aggregateEvidence(records);
  const attendance = aggregateAttendance(records, grade, subject);
  const composite = compositeRate(
    participation.participationRate,
    evidence.evidenceSubmissionRate,
    attendance.attendanceRate,
  );

  return {
    name,
    level,
    district,
    participationRate: participation.participationRate,
    evidenceSubmissionRate: evidence.evidenceSubmissionRate,
    attendanceRate: attendance.attendanceRate,
    riskStatus: classifyRiskFromRate(composite),
    schoolCount: participation.totalSchools,
    compositeScore: composite,
  };
}

export function buildGeographyPerformances(
  allRecords: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
  level: "district" | "block",
): GeographyPerformance[] {
  const scoped = filterSchoolRecords(allRecords, filters);
  const groups = new Map<string, SchoolRecord[]>();

  for (const record of scoped) {
    const key = level === "district" ? record.district : `${record.district}::${record.block}`;
    const existing = groups.get(key) ?? [];
    existing.push(record);
    groups.set(key, existing);
  }

  const performers: GeographyPerformance[] = [];
  for (const [key, records] of groups) {
    if (level === "district") {
      performers.push(
        buildGeographyPerformance(
          records,
          key,
          "district",
          undefined,
          filters.grade,
          filters.subject,
        ),
      );
    } else {
      const district = records[0]?.district ?? key.split("::")[0] ?? key;
      const blockName = records[0]?.block ?? key;
      performers.push(
        buildGeographyPerformance(
          records,
          blockName,
          "block",
          district,
          filters.grade,
          filters.subject,
        ),
      );
    }
  }

  return performers.sort((a, b) => b.compositeScore - a.compositeScore);
}

export function splitPerformers(
  performers: GeographyPerformance[],
  limit = 5,
): { highPerformers: GeographyPerformance[]; lowPerformers: GeographyPerformance[] } {
  const sorted = [...performers].sort((a, b) => b.compositeScore - a.compositeScore);
  return {
    highPerformers: sorted.slice(0, limit),
    lowPerformers: [...sorted].reverse().slice(0, limit),
  };
}

export function buildGeographyResponse(
  allRecords: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
  level: "district" | "block",
): GeographyPerformanceResponse {
  const performers = buildGeographyPerformances(allRecords, filters, level);
  const { highPerformers, lowPerformers } = splitPerformers(performers);
  return {
    reportingMonth: filters.reportingMonth,
    filters,
    performers,
    highPerformers,
    lowPerformers,
  };
}

function buildGeographyRisk(
  records: SchoolRecord[],
  name: string,
  level: "district" | "block",
  district: string | undefined,
  grade?: string,
  subject?: string,
): GeographyRiskResult {
  const participation = aggregateParticipation(records);
  const evidence = aggregateEvidence(records);
  const attendance = aggregateAttendance(records, grade, subject);

  const indicators = [
    buildRiskIndicator("participation", "Participation rate", participation.participationRate),
    buildRiskIndicator("evidence", "Evidence submission rate", evidence.evidenceSubmissionRate),
    buildRiskIndicator("attendance", "Attendance rate", attendance.attendanceRate),
    buildRiskIndicator(
      "composite",
      "Composite program score",
      compositeRate(
        participation.participationRate,
        evidence.evidenceSubmissionRate,
        attendance.attendanceRate,
      ),
    ),
  ];

  const overallRiskStatus = worstRiskStatus(indicators.map((i) => i.riskStatus));
  const compositeIndicator = indicators.find((i) => i.indicator === "composite");

  return {
    name,
    level,
    district,
    schoolCount: participation.totalSchools,
    indicators,
    overallRiskStatus,
    overallExplanation:
      compositeIndicator?.explanation ??
      explainRisk("Composite program score", compositeIndicator?.rate ?? 0),
  };
}

export function buildProgramRisks(
  allRecords: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): ProgramRisksResponse {
  const metrics = buildDashboardMetrics(allRecords, filters);
  const overall = buildOverallRiskIndicators(metrics);
  const overallRiskStatus = worstRiskStatus(overall.map((i) => i.riskStatus));

  const districtRecords = buildGeographyPerformances(allRecords, filters, "district");
  const geographies: GeographyRiskResult[] = [];

  for (const performer of districtRecords) {
    const records = filterSchoolRecords(allRecords, {
      ...filters,
      district: performer.name,
    });
    geographies.push(
      buildGeographyRisk(
        records,
        performer.name,
        "district",
        undefined,
        filters.grade,
        filters.subject,
      ),
    );
  }

  const scopeParts = [
    filters.reportingMonth,
    filters.district,
    filters.block,
    filters.grade ? `grade ${filters.grade}` : undefined,
    filters.subject,
  ].filter(Boolean);

  return {
    scope: scopeParts.join(" / ") || "program-wide",
    reportingMonth: filters.reportingMonth,
    filters,
    overall,
    overallRiskStatus,
    geographies: geographies.sort((a, b) => {
      const order: RiskStatus[] = ["Critical", "At Risk", "Behind", "On Track"];
      return order.indexOf(a.overallRiskStatus) - order.indexOf(b.overallRiskStatus);
    }),
  };
}

export function buildReviewSummary(
  allRecords: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): import("@mantra4change/shared-types").ProgramReviewSummary {
  const metrics = buildDashboardMetrics(allRecords, filters);
  const districts = buildGeographyResponse(allRecords, filters, "district");
  const blocks = buildGeographyResponse(allRecords, filters, "block");
  const risks = buildProgramRisks(allRecords, filters);

  const achievements: string[] = [];
  const gaps: string[] = [];
  const monthOverMonthChanges: string[] = [];

  if (metrics.participationRate >= 0.75) {
    achievements.push(
      `Participation rate is ${(metrics.participationRate * 100).toFixed(1)}%, meeting the On Track threshold.`,
    );
  } else {
    gaps.push(
      `${metrics.totalSchools - metrics.participatingSchools} schools did not conduct PBL this month.`,
    );
  }

  if (metrics.evidenceSubmissionRate >= 0.75) {
    achievements.push(
      `Evidence submission rate is ${(metrics.evidenceSubmissionRate * 100).toFixed(1)}%.`,
    );
  } else {
    gaps.push(
      `${metrics.totalSchools - metrics.evidenceSchools} schools have not submitted evidence.`,
    );
  }

  if (metrics.attendanceRate >= 0.75) {
    achievements.push(
      `Attendance rate is ${(metrics.attendanceRate * 100).toFixed(1)}% across filtered schools.`,
    );
  } else {
    gaps.push(
      `Attendance rate is ${(metrics.attendanceRate * 100).toFixed(1)}%, below the On Track threshold.`,
    );
  }

  const mom = metrics.monthOverMonth;
  const previousMonth = getPreviousReportingMonth(filters.reportingMonth);
  if (previousMonth && mom.participationRate !== undefined) {
    const direction = mom.participationRate >= 0 ? "increased" : "decreased";
    monthOverMonthChanges.push(
      `Participation rate ${direction} by ${Math.abs(mom.participationRate * 100).toFixed(1)} percentage points vs ${previousMonth}.`,
    );
  }
  if (previousMonth && mom.evidenceSubmissionRate !== undefined) {
    const direction = mom.evidenceSubmissionRate >= 0 ? "increased" : "decreased";
    monthOverMonthChanges.push(
      `Evidence submission rate ${direction} by ${Math.abs(mom.evidenceSubmissionRate * 100).toFixed(1)} percentage points vs ${previousMonth}.`,
    );
  }
  if (previousMonth && mom.attendanceRate !== undefined) {
    const direction = mom.attendanceRate >= 0 ? "increased" : "decreased";
    monthOverMonthChanges.push(
      `Attendance rate ${direction} by ${Math.abs(mom.attendanceRate * 100).toFixed(1)} percentage points vs ${previousMonth}.`,
    );
  }

  const priorityDistricts = districts.lowPerformers
    .filter((d) => d.riskStatus === "Critical" || d.riskStatus === "At Risk")
    .map((d) => d.name);

  const priorityBlocks = blocks.lowPerformers
    .filter((b) => b.riskStatus === "Critical" || b.riskStatus === "At Risk")
    .map((b) => `${b.name} (${b.district ?? "unknown district"})`);

  const discussionPoints = [
    `Review ${priorityDistricts.length} priority districts with elevated risk.`,
    `Confirm follow-up plan for ${priorityBlocks.length} priority blocks.`,
    `Overall program risk status: ${risks.overallRiskStatus}.`,
    ...risks.overall
      .filter((i) => i.riskStatus !== "On Track")
      .map((i) => i.explanation),
  ];

  return {
    reportingMonth: filters.reportingMonth,
    filters,
    achievements,
    gaps,
    monthOverMonthChanges,
    priorityDistricts,
    priorityBlocks,
    discussionPoints,
  };
}
