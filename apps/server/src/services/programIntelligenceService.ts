import type {
  GeographyPerformanceResponse,
  ProgramDashboardResponse,
  ProgramFilterOptions,
  ProgramReviewSummary,
  ProgramRisksResponse,
} from "@mantra4change/shared-types";
import { getPreviousReportingMonth } from "@mantra4change/shared-types";
import {
  buildDashboardMetrics,
  buildGeographyResponse,
  buildProgramRisks,
  buildReviewSummary,
  extractFilterOptions,
  parseProgramFilters,
  type ResolvedProgramFilters,
} from "../programIntelligence/index.js";
import { cacheGet, cacheSet } from "./simpleCache.js";
import {
  fetchAllSchoolRecords,
  fetchFilterSourceRecords,
} from "../repositories/schoolResponseRepository.js";

export class ProgramIntelligenceService {
  async getFilterOptions(): Promise<ProgramFilterOptions> {
    const cacheKey = `program:filters`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached as ProgramFilterOptions;

    const records = await fetchFilterSourceRecords();
    const opts = extractFilterOptions(records);
    await cacheSet(cacheKey, opts);
    return opts;
  }

  async getDashboard(query: Record<string, unknown>): Promise<ProgramDashboardResponse> {
    const filters = parseProgramFilters(query);
    const cacheKey = `program:dashboard:${JSON.stringify(filters)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached as ProgramDashboardResponse;

    const records = await this.loadRecordsForAnalysis(filters);
    const metrics = buildDashboardMetrics(records, filters);

    const payload = {
      reportingMonth: filters.reportingMonth,
      previousMonth: getPreviousReportingMonth(filters.reportingMonth),
      filters,
      metrics,
    };
    await cacheSet(cacheKey, payload);
    return payload;
  }

  async getDistrictPerformances(
    query: Record<string, unknown>,
  ): Promise<GeographyPerformanceResponse> {
    const filters = parseProgramFilters(query);
    const records = await this.loadRecordsForAnalysis(filters);
    return buildGeographyResponse(records, filters, "district");
  }

  async getBlockPerformances(
    query: Record<string, unknown>,
  ): Promise<GeographyPerformanceResponse> {
    const filters = parseProgramFilters(query);
    const records = await this.loadRecordsForAnalysis(filters);
    return buildGeographyResponse(records, filters, "block");
  }

  async getRisks(query: Record<string, unknown>): Promise<ProgramRisksResponse> {
    const filters = parseProgramFilters(query);
    const records = await this.loadRecordsForAnalysis(filters);
    return buildProgramRisks(records, filters);
  }

  async getReviewSummary(query: Record<string, unknown>): Promise<ProgramReviewSummary> {
    const filters = parseProgramFilters(query);
    const records = await this.loadRecordsForAnalysis(filters);
    return buildReviewSummary(records, filters);
  }

  private async loadRecordsForAnalysis(_filters: ResolvedProgramFilters) {
    return fetchAllSchoolRecords();
  }
}

export const programIntelligenceService = new ProgramIntelligenceService();
