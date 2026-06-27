import type {
  DashboardFilters,
  GeographyPerformanceResponse,
  ProgramDashboardResponse,
  ProgramFilterOptions,
  ProgramRisksResponse,
  ReportingMonth,
} from "@mantra4change/shared-types";
import { apiGet } from "./http";

export interface ProgramQueryFilters {
  month?: ReportingMonth;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}

function toQuery(filters: ProgramQueryFilters): Record<string, string | undefined> {
  return {
    month: filters.month,
    district: filters.district,
    block: filters.block,
    grade: filters.grade,
    subject: filters.subject,
  };
}

export function fetchProgramFilters(): Promise<ProgramFilterOptions> {
  return apiGet<ProgramFilterOptions>("/api/program/filters");
}

export function fetchProgramDashboard(
  filters: ProgramQueryFilters,
): Promise<ProgramDashboardResponse> {
  const query = new URLSearchParams(
    Object.entries(toQuery(filters)).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  return apiGet<ProgramDashboardResponse>(`/api/program/dashboard${query ? `?${query}` : ""}`);
}

export function fetchProgramDistricts(
  filters: ProgramQueryFilters,
): Promise<GeographyPerformanceResponse> {
  const query = new URLSearchParams(
    Object.entries(toQuery(filters)).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  return apiGet<GeographyPerformanceResponse>(`/api/program/districts${query ? `?${query}` : ""}`);
}

export function fetchProgramBlocks(
  filters: ProgramQueryFilters,
): Promise<GeographyPerformanceResponse> {
  const query = new URLSearchParams(
    Object.entries(toQuery(filters)).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  return apiGet<GeographyPerformanceResponse>(`/api/program/blocks${query ? `?${query}` : ""}`);
}

export function fetchProgramRisks(filters: ProgramQueryFilters): Promise<ProgramRisksResponse> {
  const query = new URLSearchParams(
    Object.entries(toQuery(filters)).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  return apiGet<ProgramRisksResponse>(`/api/program/risks${query ? `?${query}` : ""}`);
}

export function filtersToChartBody(filters: ProgramQueryFilters) {
  return {
    month: filters.month,
    district: filters.district,
    block: filters.block,
    grade: filters.grade,
    subject: filters.subject,
    exportPng: false,
  };
}

export type { DashboardFilters };
