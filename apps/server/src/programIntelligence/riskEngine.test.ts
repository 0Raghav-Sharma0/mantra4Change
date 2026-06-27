import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyRisk,
  classifyRiskFromRate,
  computeMonthOverMonthDelta,
  explainRisk,
  getPreviousReportingMonth,
} from "@mantra4change/shared-types";
import { buildDashboardMetrics } from "../programIntelligence/riskEngine.js";
import type { SchoolRecord } from "../programIntelligence/filters.js";

describe("risk classification", () => {
  it("classifies percentage thresholds correctly", () => {
    assert.equal(classifyRisk(80), "On Track");
    assert.equal(classifyRisk(75), "On Track");
    assert.equal(classifyRisk(74.9), "Behind");
    assert.equal(classifyRisk(60), "Behind");
    assert.equal(classifyRisk(59.9), "At Risk");
    assert.equal(classifyRisk(35), "At Risk");
    assert.equal(classifyRisk(34.9), "Critical");
    assert.equal(classifyRisk(0), "Critical");
  });

  it("classifies decimal rates via classifyRiskFromRate", () => {
    assert.equal(classifyRiskFromRate(0.75), "On Track");
    assert.equal(classifyRiskFromRate(0.599), "At Risk");
    assert.equal(classifyRiskFromRate(0.2), "Critical");
  });

  it("produces explainability strings", () => {
    assert.match(explainRisk("Participation rate", 0.82), /On Track/);
    assert.match(explainRisk("Participation rate", 0.62), /Behind/);
    assert.match(explainRisk("Participation rate", 0.42), /At Risk/);
    assert.match(explainRisk("Participation rate", 0.12), /Critical/);
  });
});

describe("month-over-month logic", () => {
  it("returns previous reporting month", () => {
    assert.equal(getPreviousReportingMonth("2025-09"), "2025-08");
    assert.equal(getPreviousReportingMonth("2025-08"), "2025-07");
    assert.equal(getPreviousReportingMonth("2025-07"), null);
  });

  it("computes signed rate deltas", () => {
    assert.equal(computeMonthOverMonthDelta(0.8, 0.7), 0.1);
    assert.equal(computeMonthOverMonthDelta(0.5, 0.6), -0.1);
    assert.equal(computeMonthOverMonthDelta(undefined, 0.5), undefined);
  });

  it("includes MoM on dashboard metrics when prior month exists", () => {
    const base: Omit<SchoolRecord, "reportingMonth" | "pblConducted" | "evidenceSubmitted"> = {
      schoolCode: "SYN-001",
      district: "District A",
      block: "District A - Block 001",
      classes: "Class 6",
      subjects: "Math and Science",
      enrollmentClass6: 100,
      attendanceClass6Science: 50,
      attendanceClass6Math: 50,
      enrollmentClass7: 0,
      attendanceClass7Science: 0,
      attendanceClass7Math: 0,
      enrollmentClass8: 0,
      attendanceClass8Science: 0,
      attendanceClass8Math: 0,
      totalEnrollment: 100,
      totalAttendance: 100,
      attendanceRate: 1,
    };

    const records: SchoolRecord[] = [
      { ...base, reportingMonth: "2025-08", pblConducted: false, evidenceSubmitted: false },
      { ...base, reportingMonth: "2025-09", schoolCode: "SYN-002", pblConducted: true, evidenceSubmitted: true },
    ];

    const metrics = buildDashboardMetrics(records, { reportingMonth: "2025-09" });
    assert.equal(metrics.participationRate, 1);
    assert.equal(metrics.monthOverMonth.participationRate, 1);
    assert.equal(metrics.monthOverMonth.evidenceSubmissionRate, 1);
  });

  it("omits MoM for the first reporting month", () => {
    const records: SchoolRecord[] = [
      {
        reportingMonth: "2025-07",
        schoolCode: "SYN-001",
        district: "District A",
        block: "District A - Block 001",
        pblConducted: true,
        evidenceSubmitted: true,
        classes: "Class 6",
        subjects: "Math and Science",
        enrollmentClass6: 50,
        attendanceClass6Science: 25,
        attendanceClass6Math: 25,
        enrollmentClass7: 0,
        attendanceClass7Science: 0,
        attendanceClass7Math: 0,
        enrollmentClass8: 0,
        attendanceClass8Science: 0,
        attendanceClass8Math: 0,
        totalEnrollment: 50,
        totalAttendance: 50,
        attendanceRate: 1,
      },
    ];

    const metrics = buildDashboardMetrics(records, { reportingMonth: "2025-07" });
    assert.equal(metrics.monthOverMonth.participationRate, undefined);
  });
});
