import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGrantNarrativeContext,
  extractDistrictMentions,
  validateGroundedNarrative,
  type GrantNarrativeContext,
  type ProgramNarrativeContext,
} from "./aiNarrativeService.js";
import { assembleGrantFacts } from "./grantFacts.js";
import type { ReportingMonth } from "@mantra4change/shared-types";

const reportingMonth: ReportingMonth = "2025-09";

function sampleGrantContext(): GrantNarrativeContext {
  const facts = assembleGrantFacts({
    performance: {
      grantId: "GRANT_AA_2025",
      donor: "Donor AA",
      grantName: "Learning Support Grant AA",
      reportingMonth,
      periodStart: new Date("2025-07-01"),
      periodEnd: new Date("2025-09-30"),
      periodEndDate: new Date("2025-09-30"),
      reportDueDate: new Date("2025-10-12"),
      reportStatus: "Submitted",
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
      milestoneSummary: "Monthly review completed: Completed (Program Manager)",
    },
    finance: [
      {
        budgetLine: "Facilitator orientation",
        approvedBudgetUnits: 136,
        monthlyUtilizedUnits: 37,
        cumulativeUtilizedUnits: 79,
        cumulativeUtilizationRate: 0.5837,
        financeNote: "Within plan",
      },
    ],
    evidence: [
      {
        recordId: "MEDIA_AA_01",
        recordType: "Photo",
        grantId: "GRANT_AA_2025",
        donor: "Donor AA",
        reportingMonth,
        district: "District T",
        title: "Workshop photo",
        summaryOrCaption: "Facilitators in session",
        fileName: "aa_workshop.jpg",
        relativePath: "images/aa_workshop.jpg",
        usageNote: "Report annex",
      },
    ],
  });
  return buildGrantNarrativeContext(facts);
}

function sampleProgramContext(): ProgramNarrativeContext {
  return {
    filters: { reportingMonth: "2025-09" },
    metrics: {
      totalSchools: 1200,
      participatingSchools: 980,
      participationRatePercent: 81.7,
      evidenceSchools: 850,
      evidenceSubmissionRatePercent: 70.8,
      totalEnrollment: 50000,
      totalAttendance: 42000,
      attendanceRatePercent: 84.0,
      monthOverMonth: { participationRatePoints: 1.2 },
    },
    overallRiskStatus: "At Risk",
    topRisks: [
      {
        indicator: "Evidence submission",
        ratePercent: 70.8,
        riskStatus: "At Risk",
        explanation: "Below target in several blocks.",
      },
    ],
    priorityGeographies: {
      districts: ["District AH"],
      blocks: ["Block Alpha (District AL)", "Block Beta (District AJ)"],
    },
    referencedDistricts: ["District AH", "District AL", "District AJ"],
    reviewSummary: {
      achievements: ["Participation improved in District AL."],
      gaps: ["Evidence lag in District AJ."],
      monthOverMonthChanges: ["Participation +1.2 pts vs 2025-08."],
      discussionPoints: ["Focus support on District AH blocks."],
    },
  };
}

describe("extractDistrictMentions", () => {
  it("finds district names embedded in block labels", () => {
    const mentions = extractDistrictMentions("Block Alpha (District AL)");
    assert.deepEqual(mentions, ["District AL"]);
  });
});

describe("validateGroundedNarrative", () => {
  it("accepts narrative using only context numbers and identifiers", () => {
    const context = sampleGrantContext();
    const narrative =
      "PBL completion reached 93.5% across 618 of 661 sampled schools in District T. Evidence MEDIA_AA_01 supports the report.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, true);
    assert.equal(report.errors.length, 0);
  });

  it("rejects invented numbers", () => {
    const context = sampleGrantContext();
    const narrative = "Participation unexpectedly jumped to 99.9% this month.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, false);
    assert.ok(report.rejectedNumbers.length > 0);
  });

  it("rejects unknown evidence IDs", () => {
    const context = sampleGrantContext();
    const narrative = "See evidence NEWS_FAKE_99 for additional proof.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, false);
    assert.ok(report.rejectedIdentifiers.includes("NEWS_FAKE_99"));
  });

  it("rejects unknown grant IDs", () => {
    const context = sampleGrantContext();
    const narrative = "Funding under GRANT_ZZ_2099 exceeded plan.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, false);
    assert.ok(report.rejectedIdentifiers.includes("GRANT_ZZ_2099"));
  });

  it("rejects unknown districts", () => {
    const context = sampleGrantContext();
    const narrative = "District Z showed the largest decline.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, false);
    assert.ok(report.rejectedIdentifiers.some((id) => id.includes("District Z")));
  });

  it("accepts program narrative mentioning reporting year and referenced districts", () => {
    const context = sampleProgramContext();
    const narrative =
      "September 2025 review highlights District AL and District AJ gaps, with continued focus on District AH.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, true);
    assert.equal(report.errors.length, 0);
  });

  it("dedupes repeated district validation errors", () => {
    const context = sampleProgramContext();
    const narrative = "District AL needs support. District AL remains a priority.";

    const report = validateGroundedNarrative(narrative, context);
    assert.equal(report.passed, true);
    assert.equal(report.errors.length, 0);
  });
});
