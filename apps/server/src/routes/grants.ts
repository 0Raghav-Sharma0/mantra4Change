import { Router } from "express";
import type { Env } from "../config/env.js";
import { GrantNotFoundError, createGrantReportingService } from "../services/grantReportingService.js";

export function createGrantsRouter(_env: Env): Router {
  const router = Router();
  const grantService = createGrantReportingService();

  router.get("/", async (_req, res, next) => {
    try {
      const grants = await grantService.listGrants();
      res.json(grants);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:grantId/:month/facts", async (req, res, next) => {
    try {
      const facts = await grantService.getFacts(req.params.grantId, req.params.month);
      res.json(facts);
    } catch (error) {
      if (error instanceof GrantNotFoundError) {
        res.status(404).json({ error: "grant_not_found", message: error.message });
        return;
      }
      next(error);
    }
  });

  router.get("/:grantId/:month/report", async (req, res, next) => {
    try {
      const report = await grantService.getReport(req.params.grantId, req.params.month);
      res.json(report);
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
