import { Router } from "express";
import type { HealthResponse } from "@mantra4change/shared-types";
import { getConnectionState } from "../db/connect.js";
import type { Env } from "../config/env.js";
import { AnalyticsClient } from "../services/analyticsClient.js";
import { createAiNarrativeService } from "../services/aiNarrativeService.js";

export function createHealthRouter(env: Env): Router {
  const router = Router();
  const analyticsClient = AnalyticsClient.fromEnv(env);
  const narrativeService = createAiNarrativeService(env);

  router.get("/", (_req, res) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "mantra4change-server",
      timestamp: new Date().toISOString(),
    };
    res.json(payload);
  });

  router.get("/full", async (_req, res) => {
    let analyticsStatus: "ok" | "unavailable" = "unavailable";
    try {
      await analyticsClient.getHealth();
      analyticsStatus = "ok";
    } catch {
      analyticsStatus = "unavailable";
    }

    res.json({
      status: "ok",
      service: "mantra4change-server",
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: getConnectionState(),
        analytics: analyticsStatus,
        ai: narrativeService.isEnabled() ? "enabled" : "disabled",
      },
    });
  });

  return router;
}
