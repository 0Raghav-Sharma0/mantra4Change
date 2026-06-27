/** Survey-style CSV headers → normalized camelCase field names. */

export const PBL_CSV_COLUMNS = {
  reportingMonth: "Reporting Month",
  timestamp: "Timestamp",
  schoolName: "What is the name of your school?",
  schoolCode: "What is your school's synthetic school code?",
  district: "What is the name of your district?",
  block: "Block Details",
  pblConducted: "Was the PBL project conducted in your school this month?",
  evidenceSubmitted: "Was evidence submitted for the completed PBL project?",
  classes: "In which class/classes did you conduct the PBL project?",
  subjects: "Which subject do you teach?",
  enrollmentClass6: "Total number of students enrolled in Class 6, including all sections",
  attendanceClass6Science:
    "Average student attendance during the Class 6 PBL Science session. If you did not teach Science in Class 6, enter 0.",
  attendanceClass6Math:
    "Average student attendance during the Class 6 PBL Math session. If you did not teach Math in Class 6, enter 0.",
  enrollmentClass7: "Total number of students enrolled in Class 7, including all sections",
  attendanceClass7Science:
    "Average student attendance during the Class 7 PBL Science session. If you did not teach Science in Class 7, enter 0.",
  attendanceClass7Math:
    "Average student attendance during the Class 7 PBL Math session. If you did not teach Math in Class 7, enter 0.",
  enrollmentClass8: "Total number of students enrolled in Class 8, including all sections",
  attendanceClass8Science:
    "Average student attendance during the Class 8 PBL Science session. If you did not teach Science in Class 8, enter 0.",
  attendanceClass8Math:
    "Average student attendance during the Class 8 PBL Math session. If you did not teach Math in Class 8, enter 0.",
  totalEnrollment: "Derived: Total enrollment across Classes 6-8",
  totalAttendance: "Derived: Total attendance across PBL Science and Math sessions",
  attendanceRate: "Derived: Overall PBL attendance rate",
  riskStatus: "Derived: Risk status",
} as const;

export const GRANT_FINANCE_CSV_COLUMNS = {
  grantId: "grant_id",
  donor: "donor",
  grantName: "grant_name",
  periodStart: "period_start",
  periodEnd: "period_end",
  coveredDistricts: "covered_districts",
  reportingMonth: "reporting_month",
  budgetLine: "budget_line",
  approvedBudgetUnits: "approved_budget_units",
  monthlyUtilizedUnits: "monthly_utilized_units",
  cumulativeUtilizedUnits: "cumulative_utilized_units",
  cumulativeUtilizationRate: "cumulative_utilization_rate",
  financeNote: "finance_note",
} as const;

export const GRANT_PERFORMANCE_CSV_COLUMNS = {
  grantId: "grant_id",
  donor: "donor",
  grantName: "grant_name",
  reportingMonth: "reporting_month",
  periodEndDate: "period_end_date",
  reportDueDate: "report_due_date",
  reportStatus: "report_status",
  coveredDistricts: "covered_districts",
  sampledSchoolRecords: "sampled_school_records",
  schoolsCompletedPbl: "schools_completed_pbl",
  pblCompletionRate: "pbl_completion_rate",
  schoolsWithEvidence: "schools_with_evidence",
  evidenceSubmissionRate: "evidence_submission_rate",
  totalEnrollment: "total_enrollment",
  totalAttendance: "total_attendance",
  attendanceRate: "attendance_rate",
  riskStatus: "risk_status",
  milestoneSummary: "milestone_summary",
  draftReportText: "draft_report_text",
} as const;

export const EVIDENCE_MEDIA_CSV_COLUMNS = {
  recordId: "record_id",
  recordType: "record_type",
  grantId: "grant_id",
  donor: "donor",
  reportingMonth: "reporting_month",
  district: "district",
  title: "title",
  summaryOrCaption: "summary_or_caption",
  fileName: "file_name",
  relativePath: "relative_path",
  usageNote: "usage_note",
} as const;

export function pickCsvValue(
  row: Record<string, string>,
  columnKey: string,
): string {
  return row[columnKey]?.trim() ?? "";
}
