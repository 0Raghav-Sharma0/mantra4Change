import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ReportingMonth, RiskStatus } from "@mantra4change/shared-types";

const reportingMonths = ["2025-07", "2025-08", "2025-09"] as const;
const riskStatuses = ["On Track", "Behind", "At Risk", "Critical"] as const;

const schoolResponseSchema = new Schema(
  {
    reportingMonth: {
      type: String,
      enum: reportingMonths,
      required: true,
      index: true,
    },
    submittedAt: { type: Date, required: true, index: true },
    timestampRaw: { type: String, required: true },
    schoolName: { type: String, required: true },
    schoolCode: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    block: { type: String, required: true, index: true },
    pblConducted: { type: Boolean, required: true },
    evidenceSubmitted: { type: Boolean, required: true },
    classes: { type: String, required: true },
    subjects: { type: String, required: true },
    enrollmentClass6: { type: Number, required: true, min: 0 },
    attendanceClass6Science: { type: Number, required: true, min: 0 },
    attendanceClass6Math: { type: Number, required: true, min: 0 },
    enrollmentClass7: { type: Number, required: true, min: 0 },
    attendanceClass7Science: { type: Number, required: true, min: 0 },
    attendanceClass7Math: { type: Number, required: true, min: 0 },
    enrollmentClass8: { type: Number, required: true, min: 0 },
    attendanceClass8Science: { type: Number, required: true, min: 0 },
    attendanceClass8Math: { type: Number, required: true, min: 0 },
    totalEnrollment: { type: Number, required: true, min: 0 },
    totalAttendance: { type: Number, required: true, min: 0 },
    attendanceRate: { type: Number, required: true, min: 0, max: 1 },
    riskStatus: { type: String, enum: riskStatuses, required: true, index: true },
  },
  { timestamps: true, collection: "schoolresponses" },
);

schoolResponseSchema.index({ reportingMonth: 1, schoolCode: 1 }, { unique: true });
schoolResponseSchema.index({ reportingMonth: 1, district: 1, block: 1 });

export type SchoolResponseDocument = InferSchemaType<typeof schoolResponseSchema> & {
  reportingMonth: ReportingMonth;
  riskStatus: RiskStatus;
};

export const SchoolResponseModel = mongoose.model("SchoolResponse", schoolResponseSchema);
