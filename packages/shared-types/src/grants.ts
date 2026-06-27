import type { EvidenceMediaRecord, ReportingMonth, RiskStatus } from "./index.js";

export interface GrantListItem {
  grantId: string;
  grantName: string;
  donor: string;
  reportingMonths: ReportingMonth[];
  coveredDistricts: string[];
}

export interface GrantFinanceLineFact {
  budgetLine: string;
  approvedBudgetUnits: number;
  monthlyUtilizedUnits: number;
  cumulativeUtilizedUnits: number;
  cumulativeUtilizationRate: number;
  financeNote: string;
}

export interface GrantPerformanceFacts {
  sampledSchoolRecords: number;
  schoolsCompletedPbl: number;
  pblCompletionRate: number;
  schoolsWithEvidence: number;
  evidenceSubmissionRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: RiskStatus;
}

export interface GrantMilestoneFact {
  label: string;
  status: string;
  owner: string;
}

export interface GrantEvidenceFact extends EvidenceMediaRecord {
  imageUrl: string;
}

export interface GrantFactsResponse {
  grantId: string;
  grantName: string;
  donor: string;
  reportingMonth: ReportingMonth;
  periodStart: string;
  periodEnd: string;
  periodEndDate: string;
  reportDueDate: string;
  reportStatus: string;
  coveredDistricts: string[];
  performance: GrantPerformanceFacts;
  finance: GrantFinanceLineFact[];
  milestones: GrantMilestoneFact[];
  evidence: GrantEvidenceFact[];
  aggregateFinanceUtilization: number;
}

export interface CitedFact {
  id: string;
  label: string;
  value: string;
  source: "performance" | "finance" | "milestone" | "evidence";
}

export interface GrantReportResponse {
  grantId: string;
  reportingMonth: ReportingMonth;
  narrative: string;
  narrativeSource: "deterministic" | "ai";
  citedFacts: CitedFact[];
  facts: GrantFactsResponse;
}

export interface GrantListResponse {
  grants: GrantListItem[];
}
