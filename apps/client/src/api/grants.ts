import type {
  GrantFactsResponse,
  GrantListResponse,
  GrantReportResponse,
  ReportingMonth,
} from "@mantra4change/shared-types";
import { apiGet } from "./http";

export function fetchGrantList(): Promise<GrantListResponse> {
  return apiGet<GrantListResponse>("/api/grants");
}

export function fetchGrantFacts(
  grantId: string,
  month: ReportingMonth,
): Promise<GrantFactsResponse> {
  return apiGet<GrantFactsResponse>(`/api/grants/${encodeURIComponent(grantId)}/${month}/facts`);
}

export function fetchGrantReport(
  grantId: string,
  month: ReportingMonth,
): Promise<GrantReportResponse> {
  return apiGet<GrantReportResponse>(`/api/grants/${encodeURIComponent(grantId)}/${month}/report`);
}
