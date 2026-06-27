import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ActionPriority, ActionStatus, LinkedMetric, ReportingMonth } from "@mantra4change/shared-types";

const reportingMonths = ["2025-07", "2025-08", "2025-09"] as const;
const priorities = ["high", "medium", "low"] as const;
const statuses = ["open", "in_progress", "done"] as const;
const linkedMetrics = ["participation", "evidence", "attendance", "composite"] as const;

const actionItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    scopeKey: { type: String, required: true, index: true },
    reportingMonth: { type: String, enum: reportingMonths, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    owner: { type: String, required: true },
    priority: { type: String, enum: priorities, required: true },
    dueDate: { type: String, required: true },
    status: { type: String, enum: statuses, required: true, default: "open" },
    linkedMetric: { type: String, enum: linkedMetrics, required: true },
    district: { type: String },
    block: { type: String },
    indicator: { type: String },
  },
  {
    timestamps: true,
    collection: "actionitems",
  },
);

actionItemSchema.index({ scopeKey: 1, title: 1 }, { unique: true });

export type ActionItemDocument = InferSchemaType<typeof actionItemSchema> & {
  reportingMonth: ReportingMonth;
  priority: ActionPriority;
  status: ActionStatus;
  linkedMetric: LinkedMetric;
};

export const ActionItemModel = mongoose.model("ActionItem", actionItemSchema);
