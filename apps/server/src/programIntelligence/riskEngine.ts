import type {
  DashboardMetrics,
  DashboardFilters,
  ReportingMonth,
  RiskIndicatorResult,
  RiskStatus,
} from "@mantra4change/shared-types";
import {
  classifyRiskFromRate,
  computeMonthOverMonthDelta,
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

export function buildDashboardMetrics(
  allRecords: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): DashboardMetrics {
  const currentRecords = filterSchoolRecords(allRecords, filters);
  const participation = aggregateParticipation(currentRecords);
  const evidence = aggregateEvidence(currentRecords);
  const attendance = aggregateAttendance(
    currentRecords,
    filters.grade,
    filters.subject,
  );

  const previousMonth = getPreviousReportingMonth(filters.reportingMonth);
  let monthOverMonth: DashboardMetrics["monthOverMonth"] = {};

  if (previousMonth) {
    const previousRecords = filterSchoolRecords(allRecords, {
      ...filters,
      reportingMonth: previousMonth,
    });
    const prevParticipation = aggregateParticipation(previousRecords);
    const prevEvidence = aggregateEvidence(previousRecords);
    const prevAttendance = aggregateAttendance(
      previousRecords,
      filters.grade,
      filters.subject,
    );

    monthOverMonth = {
      participationRate: computeMonthOverMonthDelta(
        participation.participationRate,
        prevParticipation.participationRate,
      ),
      evidenceSubmissionRate: computeMonthOverMonthDelta(
        evidence.evidenceSubmissionRate,
        prevEvidence.evidenceSubmissionRate,
      ),
      attendanceRate: computeMonthOverMonthDelta(
        attendance.attendanceRate,
        prevAttendance.attendanceRate,
      ),
    };
  }

  return {
    totalSchools: participation.totalSchools,
    participatingSchools: participation.participatingSchools,
    participationRate: participation.participationRate,
    evidenceSchools: evidence.evidenceSchools,
    evidenceSubmissionRate: evidence.evidenceSubmissionRate,
    totalEnrollment: attendance.totalEnrollment,
    totalAttendance: attendance.totalAttendance,
    attendanceRate: attendance.attendanceRate,
    monthOverMonth,
  };
}

export function buildRiskIndicator(
  indicator: RiskIndicatorResult["indicator"],
  label: string,
  rate: number,
): RiskIndicatorResult {
  return {
    indicator,
    rate,
    riskStatus: classifyRiskFromRate(rate),
    explanation: explainRisk(label, rate),
  };
}

export function worstRiskStatus(statuses: RiskStatus[]): RiskStatus {
  const order: RiskStatus[] = ["Critical", "At Risk", "Behind", "On Track"];
  for (const status of order) {
    if (statuses.includes(status)) return status;
  }
  return "On Track";
}

export function compositeRate(
  participationRate: number,
  evidenceRate: number,
  attendanceRate: number,
): number {
  return (participationRate + evidenceRate + attendanceRate) / 3;
}

export function buildOverallRiskIndicators(metrics: DashboardMetrics): RiskIndicatorResult[] {
  return [
    buildRiskIndicator("participation", "Participation rate", metrics.participationRate),
    buildRiskIndicator("evidence", "Evidence submission rate", metrics.evidenceSubmissionRate),
    buildRiskIndicator("attendance", "Attendance rate", metrics.attendanceRate),
    buildRiskIndicator(
      "composite",
      "Composite program score",
      compositeRate(
        metrics.participationRate,
        metrics.evidenceSubmissionRate,
        metrics.attendanceRate,
      ),
    ),
  ];
}
