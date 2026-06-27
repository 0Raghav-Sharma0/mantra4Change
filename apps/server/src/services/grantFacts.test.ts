import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReportingMonth } from "@mantra4change/shared-types";
import {
  assembleGrantFacts,
  buildCitedFacts,
  buildDeterministicGrantNarrative,
  buildEvidenceImageUrl,
  computeAggregateFinanceUtilization,
  linkEvidenceRecords,
  parseMilestoneSummary,
  type RawEvidenceMedia,
  type RawGrantFinance,
  type RawGrantPerformance,
} from "../services/grantFacts.js";

const reportingMonth: ReportingMonth = "2025-09";

const performance: RawGrantPerformance = {
  grantId: "GRANT_AA_2025",
  donor: "Donor AA",
  grantName: "Learning Support Grant AA",
  reportingMonth,
  periodStart: new Date("2025-07-01"),
  periodEnd: new Date("2025-09-30"),
  periodEndDate: new Date("2025-09-30"),
  reportDueDate: new Date("2025-10-12"),
  reportStatus: "Submitted with action plan",
  coveredDistricts: ["District T", "District G"],
  sampledSchoolRecords: 661,
  schoolsCompletedPbl: 618,
  pblCompletionRate: 0.9349,
  schoolsWithEvidence: 521,
  evidenceSubmissionRate: 0.7882,
  totalEnrollment: 115517,
  totalAttendance: 137517,
  attendanceRate: 0.5952,
  riskStatus: "At Risk",
  milestoneSummary:
    "Monthly review completed: Completed (Program Manager) | Evidence pack prepared: Completed (M&E Lead)",
};

const finance: RawGrantFinance[] = [
  {
    budgetLine: "Facilitator orientation",
    approvedBudgetUnits: 136,
    monthlyUtilizedUnits: 37,
    cumulativeUtilizedUnits: 79,
    cumulativeUtilizationRate: 0.5837,
    financeNote: "Within plan",
  },
  {
    budgetLine: "Learning material kits",
    approvedBudgetUnits: 102,
    monthlyUtilizedUnits: 28,
    cumulativeUtilizedUnits: 59,
    cumulativeUtilizationRate: 0.58,
    financeNote: "Within plan",
  },
];

const evidence: RawEvidenceMedia[] = [
  {
    recordId: "NEWS_AA_01",
    recordType: "news_clipping",
    grantId: "GRANT_AA_2025",
    donor: "Donor AA",
    reportingMonth,
    district: "District Group",
    title: "PBL classroom practices show steady improvement",
    summaryOrCaption: "Synthetic clipping summary about improved participation.",
    fileName: "synthetic_news_clip_aa_sep_2025.png",
    relativePath: "images/synthetic_news_clip_aa_sep_2025.png",
    usageNote: "Synthetic news clipping",
  },
];

describe("grant fact assembly", () => {
  it("assembles performance, finance, milestones, and evidence", () => {
    const facts = assembleGrantFacts({ performance, finance, evidence });

    assert.equal(facts.grantId, "GRANT_AA_2025");
    assert.equal(facts.performance.schoolsCompletedPbl, 618);
    assert.equal(facts.finance.length, 2);
    assert.equal(facts.milestones.length, 2);
    assert.equal(facts.milestones[0]?.label, "Monthly review completed");
    assert.equal(facts.evidence.length, 1);
    assert.ok(facts.aggregateFinanceUtilization > 0);
  });

  it("computes aggregate finance utilization from budget lines", () => {
    const aggregate = computeAggregateFinanceUtilization(
      finance.map((row) => ({
        ...row,
        cumulativeUtilizationRate: row.cumulativeUtilizationRate,
      })),
    );
    assert.equal(aggregate, (79 + 59) / (136 + 102));
  });

  it("parses milestone summary into structured facts", () => {
    const milestones = parseMilestoneSummary(performance.milestoneSummary);
    assert.equal(milestones[1]?.owner, "M&E Lead");
    assert.match(milestones[1]?.status ?? "", /Completed/);
  });
});

describe("evidence linking", () => {
  it("links evidence records with image URLs from file names only", () => {
    const linked = linkEvidenceRecords(evidence);
    assert.equal(linked[0]?.recordId, "NEWS_AA_01");
    assert.equal(
      linked[0]?.imageUrl,
      buildEvidenceImageUrl("synthetic_news_clip_aa_sep_2025.png"),
    );
    assert.equal(linked[0]?.imageUrl, "/evidence/synthetic_news_clip_aa_sep_2025.png");
  });

  it("includes evidence records in cited facts for traceability", () => {
    const facts = assembleGrantFacts({ performance, finance, evidence });
    const cited = buildCitedFacts(facts);
    const evidenceFact = cited.find((item) => item.id === "evidence-NEWS_AA_01");
    assert.ok(evidenceFact);
    assert.equal(evidenceFact?.source, "evidence");
    assert.match(evidenceFact?.value ?? "", /NEWS_AA_01/);
  });
});

describe("deterministic grant narrative", () => {
  it("builds report text only from computed facts", () => {
    const facts = assembleGrantFacts({ performance, finance, evidence });
    const narrative = buildDeterministicGrantNarrative(facts);

    assert.match(narrative, /93\.5%/);
    assert.match(narrative, /GRANT_AA_2025/);
    assert.match(narrative, /NEWS_AA_01/);
    assert.match(narrative, /Facilitator orientation/);
    assert.doesNotMatch(narrative, /hallucinated/i);
  });

  it("handles empty evidence without inventing records", () => {
    const facts = assembleGrantFacts({ performance, finance, evidence: [] });
    const narrative = buildDeterministicGrantNarrative(facts);
    assert.match(narrative, /No linked evidence records/);
  });
});
