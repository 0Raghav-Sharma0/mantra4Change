import { Router } from "express";
import type { Env } from "../config/env.js";
import { createHealthRouter } from "./health.js";
import { createChartsRouter } from "./charts.js";
import { createReportsRouter } from "./reports.js";
import { createGrantsRouter } from "./grants.js";
import { createProgramRouter } from "./program.js";
import { previewSeedCounts } from "../lib/mappers.js";

export function createApiRouter(env: Env): Router {
  const router = Router();

  router.use("/health", createHealthRouter(env));
  router.use("/program", createProgramRouter());
  router.use("/grants", createGrantsRouter(env));
  router.use("/charts", createChartsRouter(env));
  router.use("/reports", createReportsRouter(env));

  router.get("/meta/seed-preview", (_req, res) => {
    try {
      const counts = previewSeedCounts();
      res.json({ counts });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "seed_preview_failed", message });
    }
  });

  router.get("/meta/filters", async (_req, res, next) => {
    try {
      const { programIntelligenceService } = await import(
        "../services/programIntelligenceService.js"
      );
      const options = await programIntelligenceService.getFilterOptions();
      res.json(options);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
