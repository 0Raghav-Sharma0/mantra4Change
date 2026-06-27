import type { MonthlyReviewSummary } from "@mantra4change/shared-types";
import { buildMonthlyReviewSummary } from "../lib/reviewExport.js";
import { programIntelligenceService } from "./programIntelligenceService.js";

export class MonthlyReviewService {
  async getMonthlyReview(query: Record<string, unknown>): Promise<MonthlyReviewSummary> {
    const [summary, risks] = await Promise.all([
      programIntelligenceService.getReviewSummary(query),
      programIntelligenceService.getRisks(query),
    ]);
    return buildMonthlyReviewSummary(summary, risks);
  }
}

export const monthlyReviewService = new MonthlyReviewService();
