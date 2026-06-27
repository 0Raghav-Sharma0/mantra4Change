import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ReportingMonth } from "@mantra4change/shared-types";

const reportingMonths = ["2025-07", "2025-08", "2025-09"] as const;

const grantFinanceSchema = new Schema(
  {
    grantId: { type: String, required: true, index: true },
    donor: { type: String, required: true },
    grantName: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    coveredDistricts: { type: [String], required: true },
    reportingMonth: {
      type: String,
      enum: reportingMonths,
      required: true,
      index: true,
    },
    budgetLine: { type: String, required: true },
    approvedBudgetUnits: { type: Number, required: true, min: 0 },
    monthlyUtilizedUnits: { type: Number, required: true, min: 0 },
    cumulativeUtilizedUnits: { type: Number, required: true, min: 0 },
    cumulativeUtilizationRate: { type: Number, required: true, min: 0, max: 1 },
    financeNote: { type: String, required: true },
  },
  { timestamps: true, collection: "grantfinances" },
);

grantFinanceSchema.index({ grantId: 1, reportingMonth: 1, budgetLine: 1 }, { unique: true });
grantFinanceSchema.index({ reportingMonth: 1, grantId: 1 });

export type GrantFinanceDocument = InferSchemaType<typeof grantFinanceSchema> & {
  reportingMonth: ReportingMonth;
};

export const GrantFinanceModel = mongoose.model("GrantFinance", grantFinanceSchema);
