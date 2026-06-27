import {
  parseReportingMonth,
  parseRiskStatus,
  type ReportingMonth,
  type RiskStatus,
} from "@mantra4change/shared-types";

export function parseYesNo(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "y" || normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "no" || normalized === "n" || normalized === "false" || normalized === "0") {
    return false;
  }
  return fallback;
}

export function parseNumber(value: string | undefined, fallback = 0): number {
  if (value === undefined || value.trim() === "") return fallback;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseOptionalNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseSemicolonList(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const DATE_PATTERNS: Array<(raw: string) => Date | null> = [
  (raw) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return Number.isNaN(date.getTime()) ? null : date;
  },
  (raw) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
    if (!match) return null;
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? 0),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  },
];

export function parseDate(value: string | undefined): Date | null {
  if (value === undefined || value.trim() === "") return null;
  const raw = value.trim();
  for (const pattern of DATE_PATTERNS) {
    const parsed = pattern(raw);
    if (parsed) return parsed;
  }
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function parseRequiredDate(value: string | undefined, fieldName: string): Date {
  const parsed = parseDate(value);
  if (!parsed) {
    throw new Error(`Invalid date for ${fieldName}: ${value ?? "(empty)"}`);
  }
  return parsed;
}

export function parseRequiredReportingMonth(value: string | undefined): ReportingMonth {
  const month = parseReportingMonth(value?.trim() ?? "");
  if (!month) {
    throw new Error(`Invalid reporting month: ${value ?? "(empty)"}`);
  }
  return month;
}

export function parseRequiredRiskStatus(value: string | undefined): RiskStatus {
  if (!value || value.trim() === "") return "Critical";
  return parseRiskStatus(value);
}

export function parseRequiredString(value: string | undefined, fieldName: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  return trimmed;
}
