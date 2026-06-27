import {
  EvidenceMediaModel,
  GrantFinanceModel,
  GrantPerformanceModel,
} from "../models/index.js";
import type { ReportingMonth } from "@mantra4change/shared-types";
import type { RawEvidenceMedia, RawGrantFinance, RawGrantPerformance } from "../services/grantFacts.js";

function toPerformance(doc: Record<string, unknown>, periodStart: Date, periodEnd: Date): RawGrantPerformance {
  return {
    grantId: String(doc.grantId),
    donor: String(doc.donor),
    grantName: String(doc.grantName),
    reportingMonth: doc.reportingMonth as ReportingMonth,
    periodStart,
    periodEnd,
    periodEndDate: doc.periodEndDate as Date,
    reportDueDate: doc.reportDueDate as Date,
    reportStatus: String(doc.reportStatus),
    coveredDistricts: doc.coveredDistricts as string[],
    sampledSchoolRecords: Number(doc.sampledSchoolRecords),
    schoolsCompletedPbl: Number(doc.schoolsCompletedPbl),
    pblCompletionRate: Number(doc.pblCompletionRate),
    schoolsWithEvidence: Number(doc.schoolsWithEvidence),
    evidenceSubmissionRate: Number(doc.evidenceSubmissionRate),
    totalEnrollment: Number(doc.totalEnrollment),
    totalAttendance: Number(doc.totalAttendance),
    attendanceRate: Number(doc.attendanceRate),
    riskStatus: doc.riskStatus as RawGrantPerformance["riskStatus"],
    milestoneSummary: String(doc.milestoneSummary),
  };
}

export async function fetchGrantCatalog() {
  const performances = await GrantPerformanceModel.find({}).sort({ grantId: 1, reportingMonth: 1 }).lean();
  const financeMeta = await GrantFinanceModel.find({}, { grantId: 1, periodStart: 1, periodEnd: 1, coveredDistricts: 1 })
    .sort({ grantId: 1 })
    .lean();

  const byGrant = new Map<
    string,
    {
      grantId: string;
      grantName: string;
      donor: string;
      reportingMonths: ReportingMonth[];
      coveredDistricts: string[];
    }
  >();

  for (const row of performances) {
    const grantId = String(row.grantId);
    const existing = byGrant.get(grantId) ?? {
      grantId,
      grantName: String(row.grantName),
      donor: String(row.donor),
      reportingMonths: [],
      coveredDistricts: [],
    };
    existing.reportingMonths.push(row.reportingMonth as ReportingMonth);
    byGrant.set(grantId, existing);
  }

  for (const row of financeMeta) {
    const grantId = String(row.grantId);
    const existing = byGrant.get(grantId);
    if (existing && existing.coveredDistricts.length === 0) {
      existing.coveredDistricts = row.coveredDistricts as string[];
    }
  }

  return [...byGrant.values()].map((grant) => ({
    ...grant,
    reportingMonths: [...new Set(grant.reportingMonths)].sort(),
  }));
}

export async function fetchGrantRawData(grantId: string, reportingMonth: ReportingMonth) {
  const [performanceDoc, financeDocs, evidenceDocs] = await Promise.all([
    GrantPerformanceModel.findOne({ grantId, reportingMonth }).lean(),
    GrantFinanceModel.find({ grantId, reportingMonth }).sort({ budgetLine: 1 }).lean(),
    EvidenceMediaModel.find({ grantId, reportingMonth }).sort({ recordId: 1 }).lean(),
  ]);

  if (!performanceDoc) {
    return null;
  }

  const financeSample = financeDocs[0];
  const periodStart = (financeSample?.periodStart as Date | undefined) ?? new Date("2025-07-01");
  const periodEnd = (financeSample?.periodEnd as Date | undefined) ?? new Date("2025-09-30");

  const performance = toPerformance(performanceDoc as Record<string, unknown>, periodStart, periodEnd);
  const finance: RawGrantFinance[] = financeDocs.map((doc) => ({
    budgetLine: String(doc.budgetLine),
    approvedBudgetUnits: Number(doc.approvedBudgetUnits),
    monthlyUtilizedUnits: Number(doc.monthlyUtilizedUnits),
    cumulativeUtilizedUnits: Number(doc.cumulativeUtilizedUnits),
    cumulativeUtilizationRate: Number(doc.cumulativeUtilizationRate),
    financeNote: String(doc.financeNote),
  }));

  const evidence: RawEvidenceMedia[] = evidenceDocs.map((doc) => ({
    recordId: String(doc.recordId),
    recordType: String(doc.recordType),
    grantId: String(doc.grantId),
    donor: String(doc.donor),
    reportingMonth: doc.reportingMonth as ReportingMonth,
    district: String(doc.district),
    title: String(doc.title),
    summaryOrCaption: String(doc.summaryOrCaption),
    fileName: String(doc.fileName),
    relativePath: String(doc.relativePath),
    usageNote: String(doc.usageNote),
  }));

  return { performance, finance, evidence };
}
