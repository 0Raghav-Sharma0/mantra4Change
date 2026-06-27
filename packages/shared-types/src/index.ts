/** Deterministic risk classification thresholds (percentages 0–100). */
export const RISK_THRESHOLDS = {
  ON_TRACK_MIN: 75,
  BEHIND_MIN: 60,
  AT_RISK_MIN: 35,
} as const;

export type RiskStatus = "On Track" | "Behind" | "At Risk" | "Critical";

export type ReportingMonth = "2025-07" | "2025-08" | "2025-09";

export const REPORTING_MONTHS: readonly ReportingMonth[] = [
  "2025-07",
  "2025-08",
  "2025-09",
] as const;

export interface SchoolResponse {
  reportingMonth: ReportingMonth;
  submittedAt: string;
  timestampRaw: string;
  schoolName: string;
  schoolCode: string;
  district: string;
  block: string;
  pblConducted: boolean;
  evidenceSubmitted: boolean;
  classes: string;
  subjects: string;
  enrollmentClass6: number;
  attendanceClass6Science: number;
  attendanceClass6Math: number;
  enrollmentClass7: number;
  attendanceClass7Science: number;
  attendanceClass7Math: number;
  enrollmentClass8: number;
  attendanceClass8Science: number;
  attendanceClass8Math: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: RiskStatus;
}

/** @deprecated Use SchoolResponse */
export type PblSchoolResponse = SchoolResponse;

export interface GrantFinanceRecord {
  grantId: string;
  donor: string;
  grantName: string;
  periodStart: string;
  periodEnd: string;
  coveredDistricts: string[];
  reportingMonth: ReportingMonth;
  budgetLine: string;
  approvedBudgetUnits: number;
  monthlyUtilizedUnits: number;
  cumulativeUtilizedUnits: number;
  cumulativeUtilizationRate: number;
  financeNote: string;
}

export interface GrantPerformanceRecord {
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: ReportingMonth;
  periodEndDate: string;
  reportDueDate: string;
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
  riskStatus: RiskStatus;
  milestoneSummary: string;
  draftReportText: string;
}

export interface EvidenceMediaRecord {
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

export interface DashboardFilters {
  reportingMonth?: ReportingMonth;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}

export interface DashboardMetrics {
  totalSchools: number;
  participatingSchools: number;
  participationRate: number;
  evidenceSchools: number;
  evidenceSubmissionRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  monthOverMonth: {
    participationRate?: number;
    evidenceSubmissionRate?: number;
    attendanceRate?: number;
  };
}

export interface GeographyPerformance {
  name: string;
  level: "district" | "block";
  district?: string;
  participationRate: number;
  evidenceSubmissionRate: number;
  attendanceRate: number;
  riskStatus: RiskStatus;
  schoolCount: number;
  compositeScore: number;
}

export interface ProgramFilterOptions {
  reportingMonths: ReportingMonth[];
  districts: string[];
  blocks: string[];
  grades: string[];
  subjects: string[];
}

export interface RiskIndicatorResult {
  indicator: "participation" | "evidence" | "attendance" | "composite";
  rate: number;
  riskStatus: RiskStatus;
  explanation: string;
}

export interface GeographyRiskResult {
  name: string;
  level: "district" | "block";
  district?: string;
  schoolCount: number;
  indicators: RiskIndicatorResult[];
  overallRiskStatus: RiskStatus;
  overallExplanation: string;
}

export interface ProgramRisksResponse {
  scope: string;
  reportingMonth: ReportingMonth;
  filters: DashboardFilters;
  overall: RiskIndicatorResult[];
  overallRiskStatus: RiskStatus;
  geographies: GeographyRiskResult[];
}

export interface GeographyPerformanceResponse {
  reportingMonth: ReportingMonth;
  filters: DashboardFilters;
  performers: GeographyPerformance[];
  highPerformers: GeographyPerformance[];
  lowPerformers: GeographyPerformance[];
}

export interface ProgramDashboardResponse {
  reportingMonth: ReportingMonth;
  previousMonth: ReportingMonth | null;
  filters: DashboardFilters;
  metrics: DashboardMetrics;
}

export interface ProgramReviewSummary {
  reportingMonth: ReportingMonth;
  filters: DashboardFilters;
  achievements: string[];
  gaps: string[];
  monthOverMonthChanges: string[];
  priorityDistricts: string[];
  priorityBlocks: string[];
  discussionPoints: string[];
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export function classifyRiskFromRate(rateDecimal: number): RiskStatus {
  return classifyRisk(rateDecimal * 100);
}

export function classifyRisk(percentage: number): RiskStatus {
  if (percentage >= RISK_THRESHOLDS.ON_TRACK_MIN) return "On Track";
  if (percentage >= RISK_THRESHOLDS.BEHIND_MIN) return "Behind";
  if (percentage >= RISK_THRESHOLDS.AT_RISK_MIN) return "At Risk";
  return "Critical";
}

export function parseReportingMonth(value: string): ReportingMonth | null {
  if (value === "2025-07" || value === "2025-08" || value === "2025-09") {
    return value;
  }
  return null;
}

export function parseYesNo(value: string): boolean {
  return value.trim().toLowerCase() === "yes";
}

export function parseRiskStatus(value: string): RiskStatus {
  const normalized = value.trim();
  if (
    normalized === "On Track" ||
    normalized === "Behind" ||
    normalized === "At Risk" ||
    normalized === "Critical"
  ) {
    return normalized;
  }
  return "Critical";
}

export {
  computeMonthOverMonthDelta,
  computeRate,
  explainRisk,
  getLatestReportingMonth,
  getPreviousReportingMonth,
  rateToPercent,
} from "./programIntelligence.js";

export type { ChartFilterRequest, ChartResponse } from "./charts.js";
export type {
  CitedFact,
  GrantEvidenceFact,
  GrantFactsResponse,
  GrantFinanceLineFact,
  GrantListItem,
  GrantListResponse,
  GrantMilestoneFact,
  GrantPerformanceFacts,
  GrantReportResponse,
} from "./grants.js";

export type {
  AiNarrativeResponse,
  GrantNarrativeRequest,
  NarrativeValidationReport,
  ProgramNarrativeRequest,
} from "./ai.js";

export type {
  ActionItem,
  ActionItemsResponse,
  ActionPriority,
  ActionStatus,
  LinkedMetric,
  MonthlyReviewSummary,
  UpdateActionItemRequest,
} from "./review.js";
