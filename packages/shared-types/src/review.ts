import type { DashboardFilters, ReportingMonth, RiskStatus } from "./index.js";

export interface MonthlyReviewSummary {
  reportingMonth: ReportingMonth;
  filters: DashboardFilters;
  overallRiskStatus: RiskStatus;
  achievements: string[];
  gaps: string[];
  monthOverMonthChanges: string[];
  risks: Array<{
    indicator: string;
    ratePercent: number;
    riskStatus: RiskStatus;
    explanation: string;
  }>;
  priorityDistricts: string[];
  priorityBlocks: string[];
  discussionPrompts: string[];
}

export type ActionPriority = "high" | "medium" | "low";
export type ActionStatus = "open" | "in_progress" | "done";
export type LinkedMetric = "participation" | "evidence" | "attendance" | "composite";

export interface ActionItem {
  id: string;
  scopeKey: string;
  reportingMonth: ReportingMonth;
  title: string;
  description: string;
  owner: string;
  priority: ActionPriority;
  dueDate: string;
  status: ActionStatus;
  linkedMetric: LinkedMetric;
  district?: string;
  block?: string;
  indicator?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItemsResponse {
  scopeKey: string;
  reportingMonth: ReportingMonth;
  filters: DashboardFilters;
  items: ActionItem[];
}

export interface UpdateActionItemRequest {
  status?: ActionStatus;
  owner?: string;
  dueDate?: string;
  priority?: ActionPriority;
}
