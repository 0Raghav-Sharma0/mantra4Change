import { SchoolResponseModel } from "../models/SchoolResponse.js";
import type { SchoolRecord } from "../programIntelligence/filters.js";
import { buildMongoBaseFilter, type ResolvedProgramFilters } from "../programIntelligence/filters.js";

function toSchoolRecord(doc: Record<string, unknown>): SchoolRecord {
  return {
    reportingMonth: doc.reportingMonth as SchoolRecord["reportingMonth"],
    schoolCode: String(doc.schoolCode),
    district: String(doc.district),
    block: String(doc.block),
    pblConducted: Boolean(doc.pblConducted),
    evidenceSubmitted: Boolean(doc.evidenceSubmitted),
    classes: String(doc.classes),
    subjects: String(doc.subjects),
    enrollmentClass6: Number(doc.enrollmentClass6),
    attendanceClass6Science: Number(doc.attendanceClass6Science),
    attendanceClass6Math: Number(doc.attendanceClass6Math),
    enrollmentClass7: Number(doc.enrollmentClass7),
    attendanceClass7Science: Number(doc.attendanceClass7Science),
    attendanceClass7Math: Number(doc.attendanceClass7Math),
    enrollmentClass8: Number(doc.enrollmentClass8),
    attendanceClass8Science: Number(doc.attendanceClass8Science),
    attendanceClass8Math: Number(doc.attendanceClass8Math),
    totalEnrollment: Number(doc.totalEnrollment),
    totalAttendance: Number(doc.totalAttendance),
    attendanceRate: Number(doc.attendanceRate),
  };
}

export async function fetchSchoolRecordsForMonth(
  filters: ResolvedProgramFilters,
): Promise<SchoolRecord[]> {
  const mongoFilter = buildMongoBaseFilter(filters);
  const docs = await SchoolResponseModel.find(mongoFilter).lean();
  return docs.map((doc) => toSchoolRecord(doc as Record<string, unknown>));
}

export async function fetchAllSchoolRecords(): Promise<SchoolRecord[]> {
  const docs = await SchoolResponseModel.find({}).lean();
  return docs.map((doc) => toSchoolRecord(doc as Record<string, unknown>));
}

export async function fetchFilterSourceRecords(): Promise<SchoolRecord[]> {
  const docs = await SchoolResponseModel.find(
    {},
    {
      reportingMonth: 1,
      district: 1,
      block: 1,
      classes: 1,
      subjects: 1,
      schoolCode: 1,
      pblConducted: 1,
      evidenceSubmitted: 1,
      enrollmentClass6: 1,
      attendanceClass6Science: 1,
      attendanceClass6Math: 1,
      enrollmentClass7: 1,
      attendanceClass7Science: 1,
      attendanceClass7Math: 1,
      enrollmentClass8: 1,
      attendanceClass8Science: 1,
      attendanceClass8Math: 1,
      totalEnrollment: 1,
      totalAttendance: 1,
      attendanceRate: 1,
    },
  ).lean();
  return docs.map((doc) => toSchoolRecord(doc as Record<string, unknown>));
}
