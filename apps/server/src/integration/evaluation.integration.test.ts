import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase, getConnectionState } from "../db/connect.js";
import { SchoolResponseModel } from "../models/index.js";
import { createGrantReportingService } from "../services/grantReportingService.js";
import { programIntelligenceService } from "../services/programIntelligenceService.js";

const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === "1";
const VERIFY_MONTH = "2025-09";
const GRANT_ID = "GRANT_AA_2025";

describe(
  "evaluation integration",
  { skip: !RUN_INTEGRATION ? "Set RUN_INTEGRATION_TESTS=1 to run integration tests" : false },
  () => {
    const env = loadEnv();

    before(async () => {
      await connectDatabase(env);
      const count = await SchoolResponseModel.countDocuments();
      if (count === 0) {
        throw new Error("MongoDB is empty. Run npm run seed before integration tests.");
      }
    });

    after(async () => {
      await disconnectDatabase();
    });

    it("connects to MongoDB", () => {
      assert.equal(getConnectionState(), "connected");
    });

    it("returns dashboard metrics after seed", async () => {
      const dashboard = await programIntelligenceService.getDashboard({ month: VERIFY_MONTH });
      assert.ok(dashboard.metrics.totalSchools > 0);
      assert.equal(dashboard.reportingMonth, VERIFY_MONTH);
      assert.ok(dashboard.metrics.participationRate >= 0);
    });

    it("builds grant facts and deterministic report", async () => {
      const grantService = createGrantReportingService();
      const facts = await grantService.getFacts(GRANT_ID, VERIFY_MONTH);
      const report = await grantService.getReport(GRANT_ID, VERIFY_MONTH);

      assert.equal(facts.grantId, GRANT_ID);
      assert.ok(facts.performance.sampledSchoolRecords > 0);
      assert.equal(report.narrativeSource, "deterministic");
      assert.ok(report.narrative.includes(GRANT_ID));
      assert.ok(report.citedFacts.length > 0);
    });

    it("serves core HTTP routes", async () => {
      const app = createApp({ ...env, AI_ENABLED: false });
      const query = `?month=${VERIFY_MONTH}`;

      const dashboard = await request(app).get(`/api/program/dashboard${query}`);
      assert.equal(dashboard.status, 200);
      assert.ok(dashboard.body.metrics.totalSchools > 0);

      const grantReport = await request(app).get(
        `/api/grants/${GRANT_ID}/${VERIFY_MONTH}/report`,
      );
      assert.equal(grantReport.status, 200);
      assert.equal(grantReport.body.narrativeSource, "deterministic");

      const programReport = await request(app)
        .post("/api/reports/program")
        .send({ month: VERIFY_MONTH });
      assert.equal(programReport.status, 200);
      assert.ok(programReport.body.narrative.length > 0);

      const health = await request(app).get("/api/health/full");
      assert.equal(health.body.dependencies.mongodb, "connected");
    });
  },
);
