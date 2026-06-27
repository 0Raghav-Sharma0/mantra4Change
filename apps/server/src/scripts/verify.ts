import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../config/env.js";
import { createApp } from "../app.js";
import { connectDatabase, disconnectDatabase } from "../db/connect.js";
import {
  EvidenceMediaModel,
  GrantFinanceModel,
  GrantPerformanceModel,
  SchoolResponseModel,
} from "../models/index.js";
import { previewSeedCounts } from "../lib/mappers.js";
import { programIntelligenceService } from "../services/programIntelligenceService.js";
import { createGrantReportingService } from "../services/grantReportingService.js";
import request from "supertest";

const FLOAT_TOLERANCE = 0.0001;
const VERIFY_MONTH = "2025-09";
const GRANT_FIXTURE = { grantId: "GRANT_AA_2025", month: "2025-09" };

interface VerifyCheck {
  name: string;
  status: "pass" | "fail" | "skip";
  detail: string;
}

const checks: VerifyCheck[] = [];

function record(name: string, status: VerifyCheck["status"], detail: string): void {
  checks.push({ name, status, detail });
}

function flattenMetrics(value: unknown, prefix = "", output: Record<string, unknown> = {}): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      flattenMetrics(nested, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }
  output[prefix] = value;
  return output;
}

function compareMetricParity(
  nodePayload: Record<string, unknown>,
  pandasPayload: Record<string, unknown>,
): string[] {
  const nodeFlat = flattenMetrics(nodePayload);
  const pandasFlat = flattenMetrics(pandasPayload);
  const keys = new Set([...Object.keys(nodeFlat), ...Object.keys(pandasFlat)]);
  const diffs: string[] = [];

  for (const key of keys) {
    if (key.includes("filters.reportingMonth")) continue;
    const nodeValue = nodeFlat[key];
    const pandasValue = pandasFlat[key];
    if (nodeValue === undefined || pandasValue === undefined || nodeValue === null || pandasValue === null) {
      const bothEmpty =
        (nodeValue === undefined || nodeValue === null) &&
        (pandasValue === undefined || pandasValue === null);
      if (!bothEmpty) {
        diffs.push(`${key}: missing side (node=${String(nodeValue)}, pandas=${String(pandasValue)})`);
      }
      continue;
    }
    if (typeof nodeValue === "number" && typeof pandasValue === "number") {
      if (Math.abs(nodeValue - pandasValue) > FLOAT_TOLERANCE) {
        diffs.push(`${key}: node=${nodeValue} pandas=${pandasValue}`);
      }
      continue;
    }
    if (nodeValue !== pandasValue) {
      diffs.push(`${key}: node=${String(nodeValue)} pandas=${String(pandasValue)}`);
    }
  }

  return diffs;
}

function loadPandasDashboard(repoRoot: string): Record<string, unknown> {
  const analyticsDir = path.join(repoRoot, "apps/analytics");
  const venvPython = path.join(analyticsDir, ".venv/bin/python");
  const output = execFileSync(venvPython, ["-m", "app.scripts.export_dashboard_metrics"], {
    cwd: analyticsDir,
    encoding: "utf-8",
  });
  return JSON.parse(output) as Record<string, unknown>;
}

function printResultsTable(): void {
  const nameWidth = Math.max(28, ...checks.map((check) => check.name.length));
  console.log("\nVerification summary");
  console.log(`${"Check".padEnd(nameWidth)}  Status  Detail`);
  console.log(`${"-".repeat(nameWidth)}  ------  ${"-".repeat(48)}`);
  for (const check of checks) {
    const status = check.status.toUpperCase().padEnd(6);
    console.log(`${check.name.padEnd(nameWidth)}  ${status}  ${check.detail}`);
  }
}

async function verifyMongoCounts(): Promise<void> {
  const expected = previewSeedCounts();
  const actual = {
    schoolResponse: await SchoolResponseModel.countDocuments(),
    grantFinance: await GrantFinanceModel.countDocuments(),
    grantPerformance: await GrantPerformanceModel.countDocuments(),
    evidenceMedia: await EvidenceMediaModel.countDocuments(),
  };

  let allMatch = true;
  const details: string[] = [];
  for (const [collection, expectedCount] of Object.entries(expected)) {
    const actualCount = actual[collection as keyof typeof actual];
    details.push(`${collection}=${actualCount}`);
    if (actualCount !== expectedCount) {
      allMatch = false;
    }
  }

  if (actual.schoolResponse === 0) {
    record(
      "MongoDB seed counts",
      "fail",
      "Database empty � run npm run seed before verify",
    );
    return;
  }

  record(
    "MongoDB seed counts",
    allMatch ? "pass" : "fail",
    allMatch ? details.join(", ") : `${details.join(", ")} (expected CSV preview counts)`,
  );
}

async function verifyMetricParity(): Promise<void> {
  try {
    const nodeDashboard = await programIntelligenceService.getDashboard({ month: VERIFY_MONTH });
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
    const pandasDashboard = loadPandasDashboard(repoRoot);
    const diffs = compareMetricParity(
      nodeDashboard as unknown as Record<string, unknown>,
      pandasDashboard,
    );

    record(
      "Node vs pandas parity",
      diffs.length === 0 ? "pass" : "fail",
      diffs.length === 0
        ? `Dashboard metrics match within �${FLOAT_TOLERANCE}`
        : diffs.slice(0, 3).join("; "),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parity error";
    record("Node vs pandas parity", "fail", message);
  }
}

async function verifyCoreEndpoints(env: ReturnType<typeof loadEnv>): Promise<void> {
  process.env.AI_ENABLED = "false";
  const app = createApp({ ...env, AI_ENABLED: false });
  const agent = request(app);
  const query = `?month=${VERIFY_MONTH}`;
  const failures: string[] = [];

  const routes: Array<{ method: "get" | "post"; path: string; body?: unknown; optional?: boolean }> = [
    { method: "get", path: "/api/health" },
    { method: "get", path: "/api/health/full" },
    { method: "get", path: "/api/program/filters" },
    { method: "get", path: `/api/program/dashboard${query}` },
    { method: "get", path: `/api/program/risks${query}` },
    { method: "get", path: `/api/program/monthly-review${query}` },
    { method: "get", path: `/api/program/action-items${query}` },
    { method: "get", path: "/api/grants" },
    {
      method: "get",
      path: `/api/grants/${GRANT_FIXTURE.grantId}/${GRANT_FIXTURE.month}/facts`,
    },
    {
      method: "get",
      path: `/api/grants/${GRANT_FIXTURE.grantId}/${GRANT_FIXTURE.month}/report`,
    },
    {
      method: "post",
      path: "/api/reports/program",
      body: { month: VERIFY_MONTH },
    },
    {
      method: "post",
      path: "/api/charts/program-trends",
      body: { month: VERIFY_MONTH, exportPng: false },
      optional: true,
    },
  ];

  let optionalSkipped = 0;

  for (const route of routes) {
    const response =
      route.method === "get"
        ? await agent.get(route.path)
        : await agent.post(route.path).send(route.body ?? {});
    if (response.status >= 400) {
      if (route.optional) {
        optionalSkipped += 1;
        continue;
      }
      failures.push(`${route.method.toUpperCase()} ${route.path} -> ${response.status}`);
    }
  }

  const health = await agent.get("/api/health/full");
  if (health.body?.dependencies?.mongodb !== "connected") {
    failures.push(`MongoDB expected connected, got ${String(health.body?.dependencies?.mongodb)}`);
  }

  record(
    "Core endpoints (AI off)",
    failures.length === 0 ? "pass" : "fail",
    failures.length === 0
      ? `${routes.length - optionalSkipped} routes OK${optionalSkipped ? `, ${optionalSkipped} optional skipped (analytics)` : ""}, AI disabled`
      : failures.join("; "),
  );
}

async function verifyGrantPipeline(): Promise<void> {
  try {
    const grantService = createGrantReportingService();
    const facts = await grantService.getFacts(GRANT_FIXTURE.grantId, GRANT_FIXTURE.month);
    const report = await grantService.getReport(GRANT_FIXTURE.grantId, GRANT_FIXTURE.month);

    const ok =
      facts.grantId === GRANT_FIXTURE.grantId &&
      report.narrative.length > 0 &&
      report.citedFacts.length > 0 &&
      report.narrativeSource === "deterministic";

    record(
      "Grant report pipeline",
      ok ? "pass" : "fail",
      ok
        ? `${facts.evidence.length} evidence records, deterministic narrative`
        : "Grant facts/report incomplete",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grant pipeline failed";
    record("Grant report pipeline", "fail", message);
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  console.log("=== Mantra4Change Evaluation Verify ===\n");

  try {
    await connectDatabase(env);
    record("MongoDB connectivity", "pass", `Connected to ${env.MONGODB_URI}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    record("MongoDB connectivity", "fail", message);
    printResultsTable();
    process.exit(1);
  }

  await verifyMongoCounts();
  await verifyMetricParity();
  await verifyGrantPipeline();
  await verifyCoreEndpoints(env);

  await disconnectDatabase();
  printResultsTable();

  const failed = checks.some((check) => check.status === "fail");
  if (failed) {
    console.error("\nVerify failed.");
    process.exit(1);
  }

  console.log("\nVerify passed.");
}

main().catch((error: unknown) => {
  console.error("Verify crashed:", error);
  process.exit(1);
});
