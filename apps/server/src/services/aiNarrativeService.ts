import { createHash } from "node:crypto";
import type { Env } from "../config/env.js";
import type {
  AiNarrativeResponse,
  CitedFact,
  DashboardFilters,
  GrantFactsResponse,
  NarrativeValidationReport,
  ProgramDashboardResponse,
  ProgramReviewSummary,
  ProgramRisksResponse,
  ReportingMonth,
  RiskStatus,
} from "@mantra4change/shared-types";
import { RISK_THRESHOLDS } from "@mantra4change/shared-types";
import { programIntelligenceService } from "./programIntelligenceService.js";
import {
  assembleGrantFacts,
  assertValidGrantMonth,
  buildCitedFacts,
  buildDeterministicGrantNarrative,
} from "./grantFacts.js";
import { fetchGrantRawData } from "../repositories/grantRepository.js";
import { GrantNotFoundError } from "./grantReportingService.js";

const PROGRAM_REVIEW_PROMPT = `You are writing an internal program review narrative for PBL education stakeholders.

Rules:
- Use ONLY facts from the JSON context object. Never invent metrics, locations, grant IDs, or evidence IDs.
- Write 2-4 concise paragraphs in plain prose (no bullet lists unless quoting milestone-style facts).
- Reference percentages and counts exactly as provided in context.
- Mention priority districts/blocks and top risks when present in context.
- Mention only district names listed in referencedDistricts or priorityGeographies.
- Do not reference raw CSV rows or data not in context.`;

const GRANT_REPORT_PROMPT = `You are writing a donor-ready grant report section.

Rules:
- Use ONLY facts from the JSON context object. Never invent metrics, locations, grant IDs, or evidence record IDs.
- Write 2-4 concise paragraphs covering performance, finance utilization, milestones, and linked evidence.
- When citing evidence, use only record IDs present in context (e.g. MEDIA_*, NEWS_*).
- Do not reference raw CSV rows or data not in context.`;

export interface ProgramNarrativeContext {
  filters: DashboardFilters & { reportingMonth: ReportingMonth };
  metrics: {
    totalSchools: number;
    participatingSchools: number;
    participationRatePercent: number;
    evidenceSchools: number;
    evidenceSubmissionRatePercent: number;
    totalEnrollment: number;
    totalAttendance: number;
    attendanceRatePercent: number;
    monthOverMonth: {
      participationRatePoints?: number;
      evidenceSubmissionRatePoints?: number;
      attendanceRatePoints?: number;
    };
  };
  overallRiskStatus: RiskStatus;
  topRisks: Array<{
    indicator: string;
    ratePercent: number;
    riskStatus: RiskStatus;
    explanation: string;
  }>;
  priorityGeographies: {
    districts: string[];
    blocks: string[];
  };
  /** District names the model may reference (from priority geographies + review text). */
  referencedDistricts: string[];
  reviewSummary: {
    achievements: string[];
    gaps: string[];
    monthOverMonthChanges: string[];
    discussionPoints: string[];
  };
}

export interface GrantNarrativeContext {
  grantId: string;
  grantName: string;
  donor: string;
  reportingMonth: ReportingMonth;
  reportStatus: string;
  periodEndDate: string;
  reportDueDate: string;
  coveredDistricts: string[];
  performance: {
    sampledSchoolRecords: number;
    schoolsCompletedPbl: number;
    pblCompletionRatePercent: number;
    schoolsWithEvidence: number;
    evidenceSubmissionRatePercent: number;
    totalEnrollment: number;
    totalAttendance: number;
    attendanceRatePercent: number;
    riskStatus: RiskStatus;
  };
  finance: Array<{
    budgetLine: string;
    approvedBudgetUnits: number;
    monthlyUtilizedUnits: number;
    cumulativeUtilizedUnits: number;
    cumulativeUtilizationRatePercent: number;
    financeNote: string;
  }>;
  milestones: Array<{ label: string; status: string; owner: string }>;
  evidenceRecordIds: string[];
  aggregateFinanceUtilizationPercent: number;
}

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function rateToPercent(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

function momToPoints(delta: number | undefined): number | undefined {
  if (delta === undefined) return undefined;
  return Math.round(delta * 1000) / 10;
}

const DISTRICT_MENTION_PATTERN = /\bDistrict [A-Z]{1,3}\b/gi;

export function extractDistrictMentions(text: string): string[] {
  const matches = text.match(DISTRICT_MENTION_PATTERN) ?? [];
  return [...new Set(matches.map((item) => item.trim()))];
}

function collectReferencedDistricts(
  summary: ProgramReviewSummary,
  risks: ProgramRisksResponse,
  filters: DashboardFilters & { reportingMonth: ReportingMonth },
): string[] {
  const fromRiskGeographies = risks.geographies
    .filter((item) => item.level === "district")
    .filter((item) => item.overallRiskStatus === "Critical" || item.overallRiskStatus === "At Risk")
    .map((item) => item.name);

  const blob = JSON.stringify({
    priorityDistricts: summary.priorityDistricts,
    priorityBlocks: summary.priorityBlocks,
    achievements: summary.achievements,
    gaps: summary.gaps,
    monthOverMonthChanges: summary.monthOverMonthChanges,
    discussionPoints: summary.discussionPoints,
    district: filters.district,
  });

  return [
    ...new Set([
      ...summary.priorityDistricts,
      ...fromRiskGeographies,
      ...extractDistrictMentions(blob),
      ...(filters.district ? [filters.district] : []),
    ]),
  ];
}

function collectContextCalendarNumbers(context: unknown, allowed: Set<number>): void {
  const blob = JSON.stringify(context);
  for (const token of blob.match(/\b2025-\d{2}\b/g) ?? []) {
    const parts = token.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];
    if (year !== undefined && Number.isFinite(year)) allowed.add(year);
    if (month !== undefined && Number.isFinite(month)) allowed.add(month);
  }
  for (const token of blob.match(/\b20\d{2}\b/g) ?? []) {
    allowed.add(Number(token));
  }
}

function buildAllowedDistricts(
  context: ProgramNarrativeContext | GrantNarrativeContext,
): Set<string> {
  const allowed = new Set<string>();

  if ("grantId" in context) {
    for (const district of context.coveredDistricts) {
      allowed.add(district.toLowerCase());
    }
  } else {
    for (const district of context.referencedDistricts) {
      allowed.add(district.toLowerCase());
    }
    for (const district of context.priorityGeographies.districts) {
      allowed.add(district.toLowerCase());
    }
  }

  for (const district of extractDistrictMentions(JSON.stringify(context))) {
    allowed.add(district.toLowerCase());
  }

  return allowed;
}

export function buildProgramNarrativeContext(
  dashboard: ProgramDashboardResponse,
  risks: ProgramRisksResponse,
  summary: ProgramReviewSummary,
): ProgramNarrativeContext {
  const { metrics, filters, reportingMonth } = dashboard;

  return {
    filters: { ...filters, reportingMonth },
    metrics: {
      totalSchools: metrics.totalSchools,
      participatingSchools: metrics.participatingSchools,
      participationRatePercent: rateToPercent(metrics.participationRate),
      evidenceSchools: metrics.evidenceSchools,
      evidenceSubmissionRatePercent: rateToPercent(metrics.evidenceSubmissionRate),
      totalEnrollment: metrics.totalEnrollment,
      totalAttendance: metrics.totalAttendance,
      attendanceRatePercent: rateToPercent(metrics.attendanceRate),
      monthOverMonth: {
        participationRatePoints: momToPoints(metrics.monthOverMonth.participationRate),
        evidenceSubmissionRatePoints: momToPoints(metrics.monthOverMonth.evidenceSubmissionRate),
        attendanceRatePoints: momToPoints(metrics.monthOverMonth.attendanceRate),
      },
    },
    overallRiskStatus: risks.overallRiskStatus,
    topRisks: risks.overall.map((item) => ({
      indicator: item.indicator,
      ratePercent: rateToPercent(item.rate),
      riskStatus: item.riskStatus,
      explanation: item.explanation,
    })),
    priorityGeographies: {
      districts: summary.priorityDistricts,
      blocks: summary.priorityBlocks,
    },
    referencedDistricts: collectReferencedDistricts(summary, risks, {
      ...filters,
      reportingMonth,
    }),
    reviewSummary: {
      achievements: summary.achievements,
      gaps: summary.gaps,
      monthOverMonthChanges: summary.monthOverMonthChanges,
      discussionPoints: summary.discussionPoints,
    },
  };
}

export function buildGrantNarrativeContext(facts: GrantFactsResponse): GrantNarrativeContext {
  return {
    grantId: facts.grantId,
    grantName: facts.grantName,
    donor: facts.donor,
    reportingMonth: facts.reportingMonth,
    reportStatus: facts.reportStatus,
    periodEndDate: facts.periodEndDate,
    reportDueDate: facts.reportDueDate,
    coveredDistricts: facts.coveredDistricts,
    performance: {
      sampledSchoolRecords: facts.performance.sampledSchoolRecords,
      schoolsCompletedPbl: facts.performance.schoolsCompletedPbl,
      pblCompletionRatePercent: rateToPercent(facts.performance.pblCompletionRate),
      schoolsWithEvidence: facts.performance.schoolsWithEvidence,
      evidenceSubmissionRatePercent: rateToPercent(facts.performance.evidenceSubmissionRate),
      totalEnrollment: facts.performance.totalEnrollment,
      totalAttendance: facts.performance.totalAttendance,
      attendanceRatePercent: rateToPercent(facts.performance.attendanceRate),
      riskStatus: facts.performance.riskStatus,
    },
    finance: facts.finance.map((line) => ({
      budgetLine: line.budgetLine,
      approvedBudgetUnits: line.approvedBudgetUnits,
      monthlyUtilizedUnits: line.monthlyUtilizedUnits,
      cumulativeUtilizedUnits: line.cumulativeUtilizedUnits,
      cumulativeUtilizationRatePercent: rateToPercent(line.cumulativeUtilizationRate),
      financeNote: line.financeNote,
    })),
    milestones: facts.milestones,
    evidenceRecordIds: facts.evidence.map((item) => item.recordId),
    aggregateFinanceUtilizationPercent: rateToPercent(facts.aggregateFinanceUtilization),
  };
}

export function buildProgramCitedFacts(
  context: ProgramNarrativeContext,
  dashboard: ProgramDashboardResponse,
  risks: ProgramRisksResponse,
): CitedFact[] {
  const { metrics } = context;
  const cited: CitedFact[] = [
    {
      id: "program-participation-rate",
      label: "Participation rate",
      value: `${metrics.participationRatePercent}% (${metrics.participatingSchools}/${metrics.totalSchools} schools)`,
      source: "performance",
    },
    {
      id: "program-evidence-rate",
      label: "Evidence submission rate",
      value: `${metrics.evidenceSubmissionRatePercent}% (${metrics.evidenceSchools} schools)`,
      source: "performance",
    },
    {
      id: "program-attendance-rate",
      label: "Attendance rate",
      value: `${metrics.attendanceRatePercent}% (${metrics.totalAttendance.toLocaleString()} / ${metrics.totalEnrollment.toLocaleString()})`,
      source: "performance",
    },
    {
      id: "program-overall-risk",
      label: "Overall program risk",
      value: risks.overallRiskStatus,
      source: "performance",
    },
  ];

  if (dashboard.previousMonth) {
    cited.push({
      id: "program-previous-month",
      label: "Comparison month",
      value: dashboard.previousMonth,
      source: "performance",
    });
  }

  for (const risk of context.topRisks) {
    cited.push({
      id: `program-risk-${risk.indicator}`,
      label: `${risk.indicator} risk`,
      value: `${risk.ratePercent}% · ${risk.riskStatus}`,
      source: "performance",
    });
  }

  for (const district of context.priorityGeographies.districts) {
    cited.push({
      id: `priority-district-${district.toLowerCase().replace(/\s+/g, "-")}`,
      label: "Priority district",
      value: district,
      source: "milestone",
    });
  }

  for (const block of context.priorityGeographies.blocks) {
    cited.push({
      id: `priority-block-${block.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
      label: "Priority block",
      value: block,
      source: "milestone",
    });
  }

  return cited;
}

export function buildDeterministicProgramNarrative(context: ProgramNarrativeContext): string {
  const { metrics, filters, overallRiskStatus, priorityGeographies, reviewSummary } = context;
  const scopeParts = [
    filters.reportingMonth,
    filters.district,
    filters.block,
    filters.grade ? `grade ${filters.grade}` : undefined,
    filters.subject,
  ].filter(Boolean);

  const momLines = reviewSummary.monthOverMonthChanges.length
    ? reviewSummary.monthOverMonthChanges.map((line) => `- ${line}`).join("\n")
    : "- No prior-month comparison available for selected filters.";

  return [
    `Program Review Narrative — ${scopeParts.join(" / ") || "program-wide"}`,
    "",
    "Performance summary (computed from filtered school records):",
    `- Participation: ${metrics.participationRatePercent}% (${metrics.participatingSchools} of ${metrics.totalSchools} schools)`,
    `- Evidence submission: ${metrics.evidenceSubmissionRatePercent}% (${metrics.evidenceSchools} schools)`,
    `- Attendance: ${metrics.attendanceRatePercent}% across ${metrics.totalEnrollment.toLocaleString()} enrolled students`,
    `- Overall risk status: ${overallRiskStatus}`,
    "",
    "Achievements:",
    ...(reviewSummary.achievements.length
      ? reviewSummary.achievements.map((line) => `- ${line}`)
      : ["- No achievement highlights for current thresholds."]),
    "",
    "Gaps:",
    ...(reviewSummary.gaps.length
      ? reviewSummary.gaps.map((line) => `- ${line}`)
      : ["- No major gaps flagged for current thresholds."]),
    "",
    "Month-over-month changes:",
    momLines,
    "",
    `Priority districts (${priorityGeographies.districts.length}): ${priorityGeographies.districts.join("; ") || "None flagged"}`,
    `Priority blocks (${priorityGeographies.blocks.length}): ${priorityGeographies.blocks.join("; ") || "None flagged"}`,
    "",
    "Discussion points:",
    ...reviewSummary.discussionPoints.map((line) => `- ${line}`),
  ].join("\n");
}

function collectNumbers(value: unknown, numbers: Set<number>): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    numbers.add(value);
    if (value > 0 && value <= 1) {
      numbers.add(Math.round(value * 1000) / 10);
      numbers.add(Math.round(value * 10000) / 100);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNumbers(item, numbers);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectNumbers(item, numbers);
    }
  }
}

function collectStrings(value: unknown, strings: Set<string>): void {
  if (typeof value === "string" && value.trim().length > 0) {
    strings.add(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, strings);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectStrings(item, strings);
    }
  }
}

function numberMatchesAllowed(value: number, allowed: Set<number>): boolean {
  for (const candidate of allowed) {
    if (Math.abs(candidate - value) <= 0.15) return true;
    if (Math.abs(Math.round(candidate) - value) <= 0.01) return true;
  }
  return false;
}

const EXEMPT_NUMBERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 35, 60, 75]);

export function validateGroundedNarrative(
  narrative: string,
  context: ProgramNarrativeContext | GrantNarrativeContext,
): NarrativeValidationReport {
  const allowedNumbers = new Set<number>([
    ...EXEMPT_NUMBERS,
    RISK_THRESHOLDS.ON_TRACK_MIN,
    RISK_THRESHOLDS.BEHIND_MIN,
    RISK_THRESHOLDS.AT_RISK_MIN,
  ]);
  collectNumbers(context, allowedNumbers);
  collectContextCalendarNumbers(context, allowedNumbers);

  const allowedGrants = new Set<string>();
  const allowedEvidenceIds = new Set<string>();

  if ("grantId" in context) {
    allowedGrants.add(context.grantId);
    for (const id of context.evidenceRecordIds) allowedEvidenceIds.add(id);
  }

  const allowedDistricts = buildAllowedDistricts(context);

  const rejectedNumbers: string[] = [];
  const rejectedIdentifiers: string[] = [];
  const errors: string[] = [];
  const seenErrors = new Set<string>();

  const recordError = (message: string, bucket: "number" | "identifier", token: string) => {
    if (seenErrors.has(message)) return;
    seenErrors.add(message);
    errors.push(message);
    if (bucket === "number") rejectedNumbers.push(token);
    else rejectedIdentifiers.push(token);
  };

  const numericMatches = narrative.match(/\b\d+(?:\.\d+)?%?\b/g) ?? [];
  for (const token of numericMatches) {
    const numeric = Number.parseFloat(token.replace("%", ""));
    if (!Number.isFinite(numeric)) continue;
    if (EXEMPT_NUMBERS.has(numeric)) continue;
    if (token.includes("%") && numeric <= 100 && numberMatchesAllowed(numeric, allowedNumbers)) {
      continue;
    }
    if (numberMatchesAllowed(numeric, allowedNumbers)) continue;
    recordError(`Un grounded number: ${token}`, "number", token);
  }

  const grantMatches = narrative.match(/\bGRANT_[A-Z0-9_]+\b/g) ?? [];
  for (const grantId of grantMatches) {
    if (!allowedGrants.has(grantId)) {
      recordError(`Unknown grant ID: ${grantId}`, "identifier", grantId);
    }
  }

  const evidenceMatches = narrative.match(/\b(?:MEDIA|NEWS)_[A-Z0-9_]+\b/g) ?? [];
  for (const recordId of evidenceMatches) {
    if (!allowedEvidenceIds.has(recordId)) {
      recordError(`Unknown evidence record ID: ${recordId}`, "identifier", recordId);
    }
  }

  const districtMatches = narrative.match(DISTRICT_MENTION_PATTERN) ?? [];
  for (const district of districtMatches) {
    if (!allowedDistricts.has(district.toLowerCase())) {
      recordError(`Unknown location: ${district}`, "identifier", district);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    rejectedNumbers,
    rejectedIdentifiers,
  };
}

export class AiNarrativeService {
  constructor(private readonly env: Env) {}

  isEnabled(): boolean {
    return this.env.AI_ENABLED && Boolean(this.resolveApiKey());
  }

  private resolveApiKey(): string | undefined {
    return this.env.AI_API_KEY;
  }

  private resolveModel(): string {
    return this.env.AI_MODEL ?? this.env.OPENAI_MODEL;
  }

  private resolveBaseUrl(): string {
    const url =
      this.env.AI_BASE_URL ??
      this.env.OPENAI_BASE_URL ??
      "https://generativelanguage.googleapis.com/v1beta/openai";
    return url.replace(/\/$/, "");
  }

  async generateProgramNarrative(
    query: Record<string, unknown>,
    aiRequested = false,
  ): Promise<AiNarrativeResponse> {
    const dashboard = await programIntelligenceService.getDashboard(query);
    const risks = await programIntelligenceService.getRisks(query);
    const summary = await programIntelligenceService.getReviewSummary(query);
    const context = buildProgramNarrativeContext(dashboard, risks, summary);
    const citedFacts = buildProgramCitedFacts(context, dashboard, risks);
    const contextHash = hashContent(JSON.stringify(context));
    const promptHash = hashContent(PROGRAM_REVIEW_PROMPT);

    const deterministicNarrative = buildDeterministicProgramNarrative(context);

    if (!aiRequested || !this.isEnabled()) {
      return {
        narrative: deterministicNarrative,
        citedFacts,
        generatedBy: "deterministic",
        validationReport: { passed: true, errors: [], rejectedNumbers: [], rejectedIdentifiers: [] },
        contextHash,
        promptHash,
      };
    }

    return this.generateWithValidation({
      promptTemplate: PROGRAM_REVIEW_PROMPT,
      context,
      contextHash,
      promptHash,
      citedFacts,
      deterministicNarrative,
      narrativeKind: "program",
    });
  }

  async generateGrantNarrative(
    grantId: string,
    month: string,
    aiRequested = false,
  ): Promise<AiNarrativeResponse> {
    assertValidGrantMonth(month);
    const raw = await fetchGrantRawData(grantId, month);
    if (!raw) {
      throw new GrantNotFoundError(grantId, month);
    }

    const facts = assembleGrantFacts({
      performance: raw.performance,
      finance: raw.finance,
      evidence: raw.evidence,
    });
    const context = buildGrantNarrativeContext(facts);
    const citedFacts = buildCitedFacts(facts);
    const contextHash = hashContent(JSON.stringify(context));
    const promptHash = hashContent(GRANT_REPORT_PROMPT);
    const deterministicNarrative = buildDeterministicGrantNarrative(facts);

    if (!aiRequested || !this.isEnabled()) {
      return {
        narrative: deterministicNarrative,
        citedFacts,
        generatedBy: "deterministic",
        validationReport: { passed: true, errors: [], rejectedNumbers: [], rejectedIdentifiers: [] },
        contextHash,
        promptHash,
      };
    }

    return this.generateWithValidation({
      promptTemplate: GRANT_REPORT_PROMPT,
      context,
      contextHash,
      promptHash,
      citedFacts,
      deterministicNarrative,
      narrativeKind: "grant",
    });
  }

  private async generateWithValidation(input: {
    promptTemplate: string;
    context: ProgramNarrativeContext | GrantNarrativeContext;
    contextHash: string;
    promptHash: string;
    citedFacts: CitedFact[];
    deterministicNarrative: string;
    narrativeKind: "program" | "grant";
  }): Promise<AiNarrativeResponse> {
    const { promptTemplate, context, contextHash, promptHash, citedFacts, deterministicNarrative } =
      input;

    console.info(
      `[ai-narrative] kind=${input.narrativeKind} contextHash=${contextHash} promptHash=${promptHash}`,
    );

    let aiNarrative: string | null = null;

    try {
      aiNarrative = await this.callAi(promptTemplate, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      console.warn(`[ai-narrative] AI call failed: ${message}`);
    }

    if (!aiNarrative) {
      return {
        narrative: deterministicNarrative,
        citedFacts,
        generatedBy: "deterministic",
        validationReport: {
          passed: false,
          errors: ["AI provider returned no content"],
          rejectedNumbers: [],
          rejectedIdentifiers: [],
        },
        contextHash,
        promptHash,
      };
    }

    const validationReport = validateGroundedNarrative(aiNarrative, context);

    if (!validationReport.passed) {
      console.warn(
        `[ai-narrative] Validation failed contextHash=${contextHash}: ${validationReport.errors.join("; ")}`,
      );
      return {
        narrative: deterministicNarrative,
        citedFacts,
        generatedBy: "deterministic",
        validationReport,
        contextHash,
        promptHash,
      };
    }

    return {
      narrative: aiNarrative,
      citedFacts,
      generatedBy: "ai",
      validationReport,
      contextHash,
      promptHash,
    };
  }

  private async callAi(
    promptTemplate: string,
    context: ProgramNarrativeContext | GrantNarrativeContext,
  ): Promise<string | null> {
    const response = await fetch(`${this.resolveBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.resolveApiKey() ?? ""}`,
      },
      body: JSON.stringify({
        model: this.resolveModel(),
        messages: [
          { role: "system", content: promptTemplate },
          {
            role: "user",
            content: `Structured context (JSON only — do not assume any data beyond this object):\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() ?? null;
  }
}

export function createAiNarrativeService(env: Env): AiNarrativeService {
  return new AiNarrativeService(env);
}
