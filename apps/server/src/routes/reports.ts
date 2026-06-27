import { Router } from "express";
import type { Env } from "../config/env.js";
import { createAiNarrativeService } from "../services/aiNarrativeService.js";
import { GrantNotFoundError } from "../services/grantReportingService.js";

export function createReportsRouter(env: Env): Router {
  const router = Router();
  const narrativeService = createAiNarrativeService(env);

  router.post("/program", async (req, res, next) => {
    try {
      const filters = req.body as Record<string, unknown>;
      const query = {
        month: filters.month,
        district: filters.district,
        block: filters.block,
        grade: filters.grade,
        subject: filters.subject,
      };
      const aiRequested = filters.aiRequested === true;
      const result = await narrativeService.generateProgramNarrative(query, aiRequested);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/grant", async (req, res, next) => {
    try {
      const { grantId, month, aiRequested } = req.body as {
        grantId?: string;
        month?: string;
        aiRequested?: boolean;
      };

      if (!grantId || !month) {
        res.status(400).json({
          error: "invalid_request",
          message: "grantId and month are required",
        });
        return;
      }

      const result = await narrativeService.generateGrantNarrative(
        grantId,
        month,
        aiRequested === true,
      );
      res.json(result);
    } catch (error) {
      if (error instanceof GrantNotFoundError) {
        res.status(404).json({ error: "grant_not_found", message: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
}
