import type {
  ActionItem,
  ActionItemsResponse,
  DashboardFilters,
  ReportingMonth,
  UpdateActionItemRequest,
} from "@mantra4change/shared-types";
import { ActionItemModel } from "../models/ActionItem.js";
import {
  actionDocumentId,
  buildDeterministicActions,
  buildScopeKey,
} from "../programIntelligence/actionItemEngine.js";
import { parseProgramFilters } from "../programIntelligence/index.js";
import { programIntelligenceService } from "./programIntelligenceService.js";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function sortActionItems(items: ActionItem[]): ActionItem[] {
  return [...items].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.title.localeCompare(b.title),
  );
}

function toActionItem(doc: {
  _id: string;
  scopeKey: string;
  reportingMonth: ReportingMonth;
  title: string;
  description: string;
  owner: string;
  priority: ActionItem["priority"];
  dueDate: string;
  status: ActionItem["status"];
  linkedMetric: ActionItem["linkedMetric"];
  district?: string;
  block?: string;
  indicator?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): ActionItem {
  return {
    id: doc._id,
    scopeKey: doc.scopeKey,
    reportingMonth: doc.reportingMonth,
    title: doc.title,
    description: doc.description,
    owner: doc.owner,
    priority: doc.priority,
    dueDate: doc.dueDate,
    status: doc.status,
    linkedMetric: doc.linkedMetric,
    district: doc.district,
    block: doc.block,
    indicator: doc.indicator,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export class ActionItemService {
  async getActionItems(query: Record<string, unknown>): Promise<ActionItemsResponse> {
    const filters = parseProgramFilters(query);
    const scopeKey = buildScopeKey(filters);
    const existing = await ActionItemModel.find({ scopeKey }).sort({ priority: 1, title: 1 }).lean();

    if (existing.length > 0) {
      return {
        scopeKey,
        reportingMonth: filters.reportingMonth,
        filters: filters as DashboardFilters,
        items: sortActionItems(
          existing.map((doc) => toActionItem(doc as Parameters<typeof toActionItem>[0])),
        ),
      };
    }

    return this.regenerateActionItems(query);
  }

  async regenerateActionItems(query: Record<string, unknown>): Promise<ActionItemsResponse> {
    const filters = parseProgramFilters(query);
    const scopeKey = buildScopeKey(filters);
    const [summary, risks] = await Promise.all([
      programIntelligenceService.getReviewSummary(query),
      programIntelligenceService.getRisks(query),
    ]);

    const drafts = buildDeterministicActions({ scopeKey, reportingMonth: filters.reportingMonth, summary, risks });
    await ActionItemModel.deleteMany({ scopeKey });

    const created = await ActionItemModel.insertMany(
      drafts.map((draft) => ({
        _id: actionDocumentId(scopeKey, draft.title),
        ...draft,
      })),
    );

    return {
      scopeKey,
      reportingMonth: filters.reportingMonth,
      filters: filters as DashboardFilters,
      items: sortActionItems(
        created.map((doc) => toActionItem(doc.toObject() as Parameters<typeof toActionItem>[0])),
      ),
    };
  }

  async updateActionItem(id: string, patch: UpdateActionItemRequest): Promise<ActionItem | null> {
    const updated = await ActionItemModel.findByIdAndUpdate(
      id,
      {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.owner ? { owner: patch.owner } : {}),
        ...(patch.dueDate ? { dueDate: patch.dueDate } : {}),
        ...(patch.priority ? { priority: patch.priority } : {}),
      },
      { new: true },
    ).lean();

    if (!updated) return null;
    return toActionItem(updated as Parameters<typeof toActionItem>[0]);
  }
}

export const actionItemService = new ActionItemService();
