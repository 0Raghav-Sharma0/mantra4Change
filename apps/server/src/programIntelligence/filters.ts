import type { DashboardFilters, ReportingMonth } from "@mantra4change/shared-types";
import { getLatestReportingMonth, parseReportingMonth } from "@mantra4change/shared-types";

export interface SchoolRecord {
  reportingMonth: ReportingMonth;
  schoolCode: string;
  district: string;
  block: string;
  pblConducted: boolean;
  evidenceSubmitted: boolean;
  classes: string;
  subjects: string;
  enrollmentClass6: number;
  attendanceClass6Science: number;
  attendanceClass6Math: number;
  enrollmentClass7: number;
  attendanceClass7Science: number;
  attendanceClass7Math: number;
  enrollmentClass8: number;
  attendanceClass8Science: number;
  attendanceClass8Math: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
}

export interface ResolvedProgramFilters extends DashboardFilters {
  reportingMonth: ReportingMonth;
}

const GRADE_PATTERNS: Record<string, RegExp> = {
  "6": /\bClass(?:es)?\s+6\b/i,
  "7": /\bClass(?:es)?\s+7\b/i,
  "8": /\bClass(?:es)?\s+8\b/i,
};

export function parseProgramFilters(query: Record<string, unknown>): ResolvedProgramFilters {
  const reportingMonthRaw = typeof query.month === "string" ? query.month : undefined;
  const reportingMonth =
    (reportingMonthRaw ? parseReportingMonth(reportingMonthRaw) : null) ??
    getLatestReportingMonth();

  return {
    reportingMonth,
    district: typeof query.district === "string" ? query.district : undefined,
    block: typeof query.block === "string" ? query.block : undefined,
    grade: typeof query.grade === "string" ? query.grade : undefined,
    subject: typeof query.subject === "string" ? query.subject : undefined,
  };
}

export function matchesGrade(classes: string, grade: string): boolean {
  const pattern = GRADE_PATTERNS[grade];
  if (!pattern) return classes.includes(grade);
  return pattern.test(classes);
}

export function matchesSubject(subjects: string, subject: string): boolean {
  const normalized = subject.trim().toLowerCase();
  const value = subjects.toLowerCase();
  if (normalized === "math") return value.includes("math");
  if (normalized === "science") return value.includes("science");
  return value.includes(normalized);
}

export function filterSchoolRecords(
  records: SchoolRecord[],
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): SchoolRecord[] {
  return records.filter((record) => {
    if (record.reportingMonth !== filters.reportingMonth) return false;
    if (filters.district && record.district !== filters.district) return false;
    if (filters.block && record.block !== filters.block) return false;
    if (filters.grade && !matchesGrade(record.classes, filters.grade)) return false;
    if (filters.subject && !matchesSubject(record.subjects, filters.subject)) return false;
    return true;
  });
}

export function buildMongoBaseFilter(
  filters: ResolvedProgramFilters,
): Record<string, string> {
  const mongoFilter: Record<string, string> = {
    reportingMonth: filters.reportingMonth,
  };
  if (filters.district) mongoFilter.district = filters.district;
  if (filters.block) mongoFilter.block = filters.block;
  return mongoFilter;
}

export function extractFilterOptions(records: SchoolRecord[]): {
  reportingMonths: ReportingMonth[];
  districts: string[];
  blocks: string[];
  grades: string[];
  subjects: string[];
} {
  const districts = new Set<string>();
  const blocks = new Set<string>();
  const grades = new Set<string>();
  const subjects = new Set<string>();
  const months = new Set<ReportingMonth>();

  for (const record of records) {
    months.add(record.reportingMonth);
    districts.add(record.district);
    blocks.add(record.block);

    for (const grade of ["6", "7", "8"] as const) {
      if (matchesGrade(record.classes, grade)) grades.add(grade);
    }

    if (record.subjects.toLowerCase().includes("math")) subjects.add("Math");
    if (record.subjects.toLowerCase().includes("science")) subjects.add("Science");
    if (record.subjects.toLowerCase().includes("math and science")) {
      subjects.add("Math and Science");
    }
  }

  return {
    reportingMonths: [...months].sort(),
    districts: [...districts].sort(),
    blocks: [...blocks].sort(),
    grades: [...grades].sort(),
    subjects: [...subjects].sort(),
  };
}
