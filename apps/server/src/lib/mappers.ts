import { parseReportingMonth, type ReportingMonth } from "@mantra4change/shared-types";
import {
  EVIDENCE_MEDIA_CSV_COLUMNS,
  GRANT_FINANCE_CSV_COLUMNS,
  GRANT_PERFORMANCE_CSV_COLUMNS,
  PBL_CSV_COLUMNS,
  pickCsvValue,
} from "./columnMaps.js";
import {
  GRANT_CSV_FILES,
  PBL_CSV_FILES,
  grantCsvPath,
  pblCsvPath,
} from "./dataPaths.js";
import { readCsvFile } from "./csvImport.js";
import {
  parseDate,
  parseNumber,
  parseRequiredDate,
  parseRequiredReportingMonth,
  parseRequiredRiskStatus,
  parseRequiredString,
  parseSemicolonList,
  parseYesNo,
} from "./parsers.js";

export function mapSchoolResponseRow(row: Record<string, string>) {
  const cols = PBL_CSV_COLUMNS;
  const reportingMonth = parseRequiredReportingMonth(pickCsvValue(row, cols.reportingMonth));
  const timestampRaw = pickCsvValue(row, cols.timestamp);
  const submittedAt =
    parseDate(timestampRaw) ??
    parseRequiredDate(`${reportingMonth}-01`, "submittedAt fallback");

  return {
    reportingMonth,
    submittedAt,
    timestampRaw,
    schoolName: parseRequiredString(pickCsvValue(row, cols.schoolName), "schoolName"),
    schoolCode: parseRequiredString(pickCsvValue(row, cols.schoolCode), "schoolCode"),
    district: parseRequiredString(pickCsvValue(row, cols.district), "district"),
    block: parseRequiredString(pickCsvValue(row, cols.block), "block"),
    pblConducted: parseYesNo(pickCsvValue(row, cols.pblConducted)),
    evidenceSubmitted: parseYesNo(pickCsvValue(row, cols.evidenceSubmitted)),
    classes: pickCsvValue(row, cols.classes),
    subjects: pickCsvValue(row, cols.subjects),
    enrollmentClass6: parseNumber(pickCsvValue(row, cols.enrollmentClass6)),
    attendanceClass6Science: parseNumber(pickCsvValue(row, cols.attendanceClass6Science)),
    attendanceClass6Math: parseNumber(pickCsvValue(row, cols.attendanceClass6Math)),
    enrollmentClass7: parseNumber(pickCsvValue(row, cols.enrollmentClass7)),
    attendanceClass7Science: parseNumber(pickCsvValue(row, cols.attendanceClass7Science)),
    attendanceClass7Math: parseNumber(pickCsvValue(row, cols.attendanceClass7Math)),
    enrollmentClass8: parseNumber(pickCsvValue(row, cols.enrollmentClass8)),
    attendanceClass8Science: parseNumber(pickCsvValue(row, cols.attendanceClass8Science)),
    attendanceClass8Math: parseNumber(pickCsvValue(row, cols.attendanceClass8Math)),
    totalEnrollment: parseNumber(pickCsvValue(row, cols.totalEnrollment)),
    totalAttendance: parseNumber(pickCsvValue(row, cols.totalAttendance)),
    attendanceRate: parseNumber(pickCsvValue(row, cols.attendanceRate)),
    riskStatus: parseRequiredRiskStatus(pickCsvValue(row, cols.riskStatus)),
  };
}

export function mapGrantFinanceRow(row: Record<string, string>) {
  const cols = GRANT_FINANCE_CSV_COLUMNS;

  return {
    grantId: parseRequiredString(pickCsvValue(row, cols.grantId), "grantId"),
    donor: parseRequiredString(pickCsvValue(row, cols.donor), "donor"),
    grantName: parseRequiredString(pickCsvValue(row, cols.grantName), "grantName"),
    periodStart: parseRequiredDate(pickCsvValue(row, cols.periodStart), "periodStart"),
    periodEnd: parseRequiredDate(pickCsvValue(row, cols.periodEnd), "periodEnd"),
    coveredDistricts: parseSemicolonList(pickCsvValue(row, cols.coveredDistricts)),
    reportingMonth: parseRequiredReportingMonth(pickCsvValue(row, cols.reportingMonth)),
    budgetLine: parseRequiredString(pickCsvValue(row, cols.budgetLine), "budgetLine"),
    approvedBudgetUnits: parseNumber(pickCsvValue(row, cols.approvedBudgetUnits)),
    monthlyUtilizedUnits: parseNumber(pickCsvValue(row, cols.monthlyUtilizedUnits)),
    cumulativeUtilizedUnits: parseNumber(pickCsvValue(row, cols.cumulativeUtilizedUnits)),
    cumulativeUtilizationRate: parseNumber(
      pickCsvValue(row, cols.cumulativeUtilizationRate),
    ),
    financeNote: pickCsvValue(row, cols.financeNote),
  };
}

export function mapGrantPerformanceRow(row: Record<string, string>) {
  const cols = GRANT_PERFORMANCE_CSV_COLUMNS;

  return {
    grantId: parseRequiredString(pickCsvValue(row, cols.grantId), "grantId"),
    donor: parseRequiredString(pickCsvValue(row, cols.donor), "donor"),
    grantName: parseRequiredString(pickCsvValue(row, cols.grantName), "grantName"),
    reportingMonth: parseRequiredReportingMonth(pickCsvValue(row, cols.reportingMonth)),
    periodEndDate: parseRequiredDate(
      pickCsvValue(row, cols.periodEndDate),
      "periodEndDate",
    ),
    reportDueDate: parseRequiredDate(
      pickCsvValue(row, cols.reportDueDate),
      "reportDueDate",
    ),
    reportStatus: pickCsvValue(row, cols.reportStatus),
    coveredDistricts: parseSemicolonList(pickCsvValue(row, cols.coveredDistricts)),
    sampledSchoolRecords: parseNumber(pickCsvValue(row, cols.sampledSchoolRecords)),
    schoolsCompletedPbl: parseNumber(pickCsvValue(row, cols.schoolsCompletedPbl)),
    pblCompletionRate: parseNumber(pickCsvValue(row, cols.pblCompletionRate)),
    schoolsWithEvidence: parseNumber(pickCsvValue(row, cols.schoolsWithEvidence)),
    evidenceSubmissionRate: parseNumber(pickCsvValue(row, cols.evidenceSubmissionRate)),
    totalEnrollment: parseNumber(pickCsvValue(row, cols.totalEnrollment)),
    totalAttendance: parseNumber(pickCsvValue(row, cols.totalAttendance)),
    attendanceRate: parseNumber(pickCsvValue(row, cols.attendanceRate)),
    riskStatus: parseRequiredRiskStatus(pickCsvValue(row, cols.riskStatus)),
    milestoneSummary: pickCsvValue(row, cols.milestoneSummary),
    draftReportText: pickCsvValue(row, cols.draftReportText),
  };
}

export function mapEvidenceMediaRow(row: Record<string, string>) {
  const cols = EVIDENCE_MEDIA_CSV_COLUMNS;

  return {
    recordId: parseRequiredString(pickCsvValue(row, cols.recordId), "recordId"),
    recordType: parseRequiredString(pickCsvValue(row, cols.recordType), "recordType"),
    grantId: parseRequiredString(pickCsvValue(row, cols.grantId), "grantId"),
    donor: parseRequiredString(pickCsvValue(row, cols.donor), "donor"),
    reportingMonth: parseRequiredReportingMonth(pickCsvValue(row, cols.reportingMonth)),
    district: pickCsvValue(row, cols.district),
    title: pickCsvValue(row, cols.title),
    summaryOrCaption: pickCsvValue(row, cols.summaryOrCaption),
    fileName: pickCsvValue(row, cols.fileName),
    relativePath: pickCsvValue(row, cols.relativePath),
    usageNote: pickCsvValue(row, cols.usageNote),
  };
}

export interface CsvLoadSummary {
  fileName: string;
  rowCount: number;
}

export function loadSchoolResponseDocuments(): {
  documents: ReturnType<typeof mapSchoolResponseRow>[];
  fileSummaries: CsvLoadSummary[];
} {
  const documents: ReturnType<typeof mapSchoolResponseRow>[] = [];
  const fileSummaries: CsvLoadSummary[] = [];

  for (const fileName of PBL_CSV_FILES) {
    const rows = readCsvFile(pblCsvPath(fileName));
    for (const row of rows) {
      documents.push(mapSchoolResponseRow(row));
    }
    fileSummaries.push({ fileName, rowCount: rows.length });
  }

  return { documents, fileSummaries };
}

export function loadGrantFinanceDocuments() {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.finance)).map(mapGrantFinanceRow);
}

export function loadGrantPerformanceDocuments() {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.performance)).map(
    mapGrantPerformanceRow,
  );
}

export function loadEvidenceMediaDocuments() {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.evidence)).map(mapEvidenceMediaRow);
}

export type SeedCounts = {
  schoolResponse: number;
  grantFinance: number;
  grantPerformance: number;
  evidenceMedia: number;
};

export function previewSeedCounts(): SeedCounts {
  return {
    schoolResponse: loadSchoolResponseDocuments().documents.length,
    grantFinance: loadGrantFinanceDocuments().length,
    grantPerformance: loadGrantPerformanceDocuments().length,
    evidenceMedia: loadEvidenceMediaDocuments().length,
  };
}

export function assertUniqueSchoolMonthKeys(
  documents: Array<{ reportingMonth: ReportingMonth; schoolCode: string }>,
): void {
  const seen = new Set<string>();
  for (const doc of documents) {
    const key = `${doc.reportingMonth}::${doc.schoolCode}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate school/month key detected: ${key}`);
    }
    seen.add(key);
  }
}

/** @deprecated Use mapSchoolResponseRow */
export const mapPblRow = mapSchoolResponseRow;

/** @deprecated Use loadSchoolResponseDocuments */
export function loadAllPblDocuments() {
  return loadSchoolResponseDocuments().documents;
}

export function assertValidReportingMonth(
  month: string,
): asserts month is ReportingMonth {
  if (!parseReportingMonth(month)) {
    throw new Error(`Invalid reporting month: ${month}`);
  }
}
