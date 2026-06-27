import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ReportingMonth } from "@mantra4change/shared-types";

const reportingMonths = ["2025-07", "2025-08", "2025-09"] as const;

const evidenceMediaSchema = new Schema(
  {
    recordId: { type: String, required: true, unique: true },
    recordType: { type: String, required: true },
    grantId: { type: String, required: true, index: true },
    donor: { type: String, required: true },
    reportingMonth: {
      type: String,
      enum: reportingMonths,
      required: true,
      index: true,
    },
    district: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summaryOrCaption: { type: String, required: true },
    fileName: { type: String, required: true },
    relativePath: { type: String, required: true },
    usageNote: { type: String, required: true },
  },
  { timestamps: true, collection: "evidencemedia" },
);

evidenceMediaSchema.index({ grantId: 1, reportingMonth: 1 });
evidenceMediaSchema.index({ reportingMonth: 1, grantId: 1 });

export type EvidenceMediaDocument = InferSchemaType<typeof evidenceMediaSchema> & {
  reportingMonth: ReportingMonth;
};

export const EvidenceMediaModel = mongoose.model("EvidenceMedia", evidenceMediaSchema);
