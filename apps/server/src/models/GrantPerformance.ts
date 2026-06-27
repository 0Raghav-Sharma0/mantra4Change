import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ReportingMonth, RiskStatus } from "@mantra4change/shared-types";

const reportingMonths = ["2025-07", "2025-08", "2025-09"] as const;
const riskStatuses = ["On Track", "Behind", "At Risk", "Critical"] as const;

const grantPerformanceSchema = new Schema(
  {
    grantId: { type: String, required: true, index: true },
    donor: { type: String, required: true },
    grantName: { type: String, required: true },
    reportingMonth: {
      type: String,
      enum: reportingMonths,
      required: true,
      index: true,
    },
    periodEndDate: { type: Date, required: true },
    reportDueDate: { type: Date, required: true },
    reportStatus: { type: String, required: true },
    coveredDistricts: { type: [String], required: true },
    sampledSchoolRecords: { type: Number, required: true, min: 0 },
    schoolsCompletedPbl: { type: Number, required: true, min: 0 },
    pblCompletionRate: { type: Number, required: true, min: 0, max: 1 },
    schoolsWithEvidence: { type: Number, required: true, min: 0 },
    evidenceSubmissionRate: { type: Number, required: true, min: 0, max: 1 },
    totalEnrollment: { type: Number, required: true, min: 0 },
    totalAttendance: { type: Number, required: true, min: 0 },
    attendanceRate: { type: Number, required: true, min: 0, max: 1 },
    riskStatus: { type: String, enum: riskStatuses, required: true },
    milestoneSummary: { type: String, required: true },
    draftReportText: { type: String, required: true },
  },
  { timestamps: true, collection: "grantperformances" },
);

grantPerformanceSchema.index({ grantId: 1, reportingMonth: 1 }, { unique: true });
grantPerformanceSchema.index({ reportingMonth: 1, grantId: 1 });

export type GrantPerformanceDocument = InferSchemaType<typeof grantPerformanceSchema> & {
  reportingMonth: ReportingMonth;
  riskStatus: RiskStatus;
};

export const GrantPerformanceModel = mongoose.model(
  "GrantPerformance",
  grantPerformanceSchema,
);
