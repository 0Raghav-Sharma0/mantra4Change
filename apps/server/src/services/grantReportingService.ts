import type { GrantFactsResponse, GrantReportResponse, ReportingMonth } from "@mantra4change/shared-types";
import { fetchGrantCatalog, fetchGrantRawData } from "../repositories/grantRepository.js";
import { cacheGet, cacheSet } from "./simpleCache.js";
import {
  assembleGrantFacts,
  assertValidGrantMonth,
  buildCitedFacts,
  buildDeterministicGrantNarrative,
} from "./grantFacts.js";

export class GrantReportingService {

  async listGrants() {
    const cacheKey = "grant:catalog";
    const cached = await cacheGet(cacheKey);
    if (cached) return { grants: cached as unknown as any };

    const grants = await fetchGrantCatalog();
    await cacheSet(cacheKey, grants);
    return { grants };
  }

  async getFacts(grantId: string, month: string): Promise<GrantFactsResponse> {
    assertValidGrantMonth(month);
    const cacheKey = `grant:${grantId}:${month}:facts`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached as GrantFactsResponse;

    const raw = await fetchGrantRawData(grantId, month);
    if (!raw) {
      throw new GrantNotFoundError(grantId, month);
    }
    return assembleGrantFacts({
      performance: raw.performance,
      finance: raw.finance,
      evidence: raw.evidence,
    });
  }

  async getReport(grantId: string, month: string): Promise<GrantReportResponse> {
    const cacheKey = `grant:${grantId}:${month}:report`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached as GrantReportResponse;

    const facts = await this.getFacts(grantId, month);
    const citedFacts = buildCitedFacts(facts);
    const narrative = buildDeterministicGrantNarrative(facts);

    return {
      grantId,
      reportingMonth: month as ReportingMonth,
      narrative,
      narrativeSource: "deterministic",
      citedFacts,
      facts,
    };
  }
}

export class GrantNotFoundError extends Error {
  constructor(grantId: string, month: string) {
    super(`Grant facts not found for ${grantId} / ${month}`);
    this.name = "GrantNotFoundError";
  }
}

export function createGrantReportingService(): GrantReportingService {
  return new GrantReportingService();
}
