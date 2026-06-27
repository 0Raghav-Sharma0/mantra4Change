import type {
  ActionItem,
  ActionItemsResponse,
  MonthlyReviewSummary,
  UpdateActionItemRequest,
} from "@mantra4change/shared-types";
import { apiGet, apiPatch, apiPost, buildQuery } from "./http";
import type { ProgramQueryFilters } from "./program";

function toQuery(filters: ProgramQueryFilters): Record<string, string | undefined> {
  return {
    month: filters.month,
    district: filters.district,
    block: filters.block,
    grade: filters.grade,
    subject: filters.subject,
  };
}

export function fetchMonthlyReview(filters: ProgramQueryFilters): Promise<MonthlyReviewSummary> {
  return apiGet<MonthlyReviewSummary>(`/api/program/monthly-review${buildQuery(toQuery(filters))}`);
}

export function fetchActionItems(filters: ProgramQueryFilters): Promise<ActionItemsResponse> {
  return apiGet<ActionItemsResponse>(`/api/program/action-items${buildQuery(toQuery(filters))}`);
}

export function regenerateActionItems(filters: ProgramQueryFilters): Promise<ActionItemsResponse> {
  return apiPost<ActionItemsResponse>(
    `/api/program/action-items/regenerate${buildQuery(toQuery(filters))}`,
    {},
  );
}

export function updateActionItem(
  id: string,
  patch: UpdateActionItemRequest,
): Promise<ActionItem> {
  return apiPatch<ActionItem>(`/api/program/action-items/${encodeURIComponent(id)}`, patch);
}
