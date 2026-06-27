import type {
  ActionItem,
  ActionPriority,
  ActionStatus,
  DashboardFilters,
  LinkedMetric,
  ProgramRisksResponse,
  ProgramReviewSummary,
  ReportingMonth,
  RiskStatus,
} from "@mantra4change/shared-types";

const RISK_ORDER: RiskStatus[] = ["Critical", "At Risk", "Behind", "On Track"];

export function buildScopeKey(
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): string {
  return [
    filters.reportingMonth,
    filters.district ?? "",
    filters.block ?? "",
    filters.grade ?? "",
    filters.subject ?? "",
  ].join("|");
}

export function riskToPriority(status: RiskStatus): ActionPriority {
  if (status === "Critical" || status === "At Risk") return "high";
  if (status === "Behind") return "medium";
  return "low";
}

export function computeActionDueDate(reportingMonth: ReportingMonth): string {
  const [yearText, monthText] = reportingMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-15`;
}

function metricOwner(metric: LinkedMetric): string {
  switch (metric) {
    case "participation":
      return "Program Manager";
    case "evidence":
      return "M&E Lead";
    case "attendance":
      return "Academic Lead";
    default:
      return "Program Director";
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface DraftAction {
  title: string;
  description: string;
  owner: string;
  priority: ActionPriority;
  linkedMetric: LinkedMetric;
  district?: string;
  block?: string;
  indicator?: string;
}

export function buildDeterministicActions(input: {
  scopeKey: string;
  reportingMonth: ReportingMonth;
  summary: ProgramReviewSummary;
  risks: ProgramRisksResponse;
  now?: Date;
}): Omit<ActionItem, "id">[] {
  const { scopeKey, reportingMonth, summary, risks } = input;
  const dueDate = computeActionDueDate(reportingMonth);
  const drafts: DraftAction[] = [];

  const elevatedIndicators = risks.overall
    .filter((item) => item.indicator !== "composite" && item.riskStatus !== "On Track")
    .sort(
      (a, b) => RISK_ORDER.indexOf(a.riskStatus) - RISK_ORDER.indexOf(b.riskStatus),
    );

  for (const indicator of elevatedIndicators.slice(0, 2)) {
    drafts.push({
      title: `Improve ${indicator.indicator} rate`,
      description: indicator.explanation,
      owner: metricOwner(indicator.indicator as LinkedMetric),
      priority: riskToPriority(indicator.riskStatus),
      linkedMetric: indicator.indicator as LinkedMetric,
      indicator: indicator.indicator,
    });
  }

  for (const district of summary.priorityDistricts.slice(0, 2)) {
    const geo = risks.geographies.find((item) => item.name === district);
    drafts.push({
      title: `District recovery plan: ${district}`,
      description:
        geo?.overallExplanation ??
        `Escalate support for ${district} based on elevated composite risk.`,
      owner: "District Lead",
      priority: riskToPriority(geo?.overallRiskStatus ?? "At Risk"),
      linkedMetric: "composite",
      district,
      indicator: "composite",
    });
  }

  if (drafts.length < 5 && summary.priorityBlocks.length > 0) {
    const blockLabel = summary.priorityBlocks[0] ?? "";
    const blockMatch = /^(.+?) \((.+)\)$/.exec(blockLabel);
    drafts.push({
      title: `Block follow-up: ${blockMatch?.[1] ?? blockLabel}`,
      description: `Confirm school-level interventions for ${blockLabel}.`,
      owner: "Block Coordinator",
      priority: "high",
      linkedMetric: "composite",
      block: blockMatch?.[1],
      district: blockMatch?.[2],
      indicator: "composite",
    });
  }

  if (drafts.length < 3 && summary.gaps.length > 0) {
    drafts.push({
      title: "Close reported program gaps",
      description: summary.gaps[0] ?? "Address the highest-priority gap from this review cycle.",
      owner: "Program Manager",
      priority: "medium",
      linkedMetric: "participation",
      indicator: "participation",
    });
  }

  const nowIso = (input.now ?? new Date()).toISOString();
  const uniqueDrafts = drafts.slice(0, 5);

  return uniqueDrafts.map((draft) => ({
    scopeKey,
    reportingMonth,
    title: draft.title,
    description: draft.description,
    owner: draft.owner,
    priority: draft.priority,
    dueDate,
    status: "open" as ActionStatus,
    linkedMetric: draft.linkedMetric,
    district: draft.district,
    block: draft.block,
    indicator: draft.indicator,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

export function actionDocumentId(scopeKey: string, title: string): string {
  return `${slugify(scopeKey)}--${slugify(title)}`;
}
