import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actionDocumentId,
  buildDeterministicActions,
  buildScopeKey,
  computeActionDueDate,
  riskToPriority,
} from "../programIntelligence/actionItemEngine.js";
import { buildMonthlyReviewMarkdown } from "../lib/reviewExport.js";
import type { ProgramReviewSummary, ProgramRisksResponse, ReportingMonth } from "@mantra4change/shared-types";

const month: ReportingMonth = "2025-09";

const summary: ProgramReviewSummary = {
  reportingMonth: month,
  filters: { reportingMonth: month },
  achievements: ["Participation rate is 78.0%, meeting the On Track threshold."],
  gaps: ["42 schools did not conduct PBL this month."],
  monthOverMonthChanges: ["Participation rate increased by 1.2 percentage points vs 2025-08."],
  priorityDistricts: ["District T", "District G"],
  priorityBlocks: ["Block Alpha (District T)"],
  discussionPoints: ["Review 2 priority districts with elevated risk."],
};

const risks: ProgramRisksResponse = {
  scope: month,
  reportingMonth: month,
  filters: { reportingMonth: month },
  overallRiskStatus: "At Risk",
  overall: [
    {
      indicator: "participation",
      rate: 0.78,
      riskStatus: "On Track",
      explanation: "Participation rate is 78.0%, classified as On Track (>= 75%).",
    },
    {
      indicator: "evidence",
      rate: 0.52,
      riskStatus: "At Risk",
      explanation: "Evidence submission rate is 52.0%, classified as At Risk (35% to below 60%).",
    },
    {
      indicator: "attendance",
      rate: 0.58,
      riskStatus: "At Risk",
      explanation: "Attendance rate is 58.0%, classified as At Risk (35% to below 60%).",
    },
    {
      indicator: "composite",
      rate: 0.63,
      riskStatus: "Behind",
      explanation: "Composite program score is 63.0%, classified as Behind (60% to below 75%).",
    },
  ],
  geographies: [
    {
      name: "District T",
      level: "district",
      schoolCount: 120,
      indicators: [],
      overallRiskStatus: "Critical",
      overallExplanation: "District T composite score is Critical.",
    },
  ],
};

describe("actionItemEngine", () => {
  it("builds a stable scope key from filters", () => {
    assert.equal(buildScopeKey({ reportingMonth: month, district: "District T" }), "2025-09|District T|||");
  });

  it("maps risk severity to action priority", () => {
    assert.equal(riskToPriority("Critical"), "high");
    assert.equal(riskToPriority("Behind"), "medium");
  });

  it("computes due date in the month after reporting month", () => {
    assert.equal(computeActionDueDate("2025-09"), "2025-10-15");
  });

  it("generates 3-5 deterministic actions linked to metrics and geographies", () => {
    const scopeKey = buildScopeKey({ reportingMonth: month });
    const actions = buildDeterministicActions({ scopeKey, reportingMonth: month, summary, risks });

    assert.ok(actions.length >= 3);
    assert.ok(actions.length <= 5);
    assert.ok(actions.some((item) => item.linkedMetric === "evidence"));
    assert.ok(actions.some((item) => item.district === "District T"));
    assert.ok(actions.every((item) => item.owner.length > 0));
  });

  it("creates stable document ids", () => {
    assert.equal(
      actionDocumentId("2025-09|||", "Improve evidence rate"),
      "2025-09--improve-evidence-rate",
    );
  });
});

describe("review markdown export", () => {
  it("builds leadership-ready markdown", () => {
    const markdown = buildMonthlyReviewMarkdown({
      reportingMonth: month,
      filters: { reportingMonth: month },
      overallRiskStatus: "At Risk",
      achievements: summary.achievements,
      gaps: summary.gaps,
      monthOverMonthChanges: summary.monthOverMonthChanges,
      risks: risks.overall
        .filter((item) => item.indicator !== "composite")
        .map((item) => ({
          indicator: item.indicator,
          ratePercent: 52,
          riskStatus: item.riskStatus,
          explanation: item.explanation,
        })),
      priorityDistricts: summary.priorityDistricts,
      priorityBlocks: summary.priorityBlocks,
      discussionPrompts: summary.discussionPoints,
    });

    assert.match(markdown, /# Monthly Program Review/);
    assert.match(markdown, /Discussion prompts/);
    assert.match(markdown, /District T/);
  });
});
