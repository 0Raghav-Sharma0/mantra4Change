import { Router } from "express";
import { actionItemService } from "../services/actionItemService.js";
import { monthlyReviewService } from "../services/monthlyReviewService.js";
import { programIntelligenceService } from "../services/programIntelligenceService.js";

export function createProgramRouter(): Router {
  const router = Router();

  router.get("/filters", async (_req, res, next) => {
    try {
      const options = await programIntelligenceService.getFilterOptions();
      res.json(options);
    } catch (error) {
      next(error);
    }
  });

  router.get("/dashboard", async (req, res, next) => {
    try {
      const dashboard = await programIntelligenceService.getDashboard(req.query);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  });

  router.get("/districts", async (req, res, next) => {
    try {
      const districts = await programIntelligenceService.getDistrictPerformances(req.query);
      res.json(districts);
    } catch (error) {
      next(error);
    }
  });

  router.get("/blocks", async (req, res, next) => {
    try {
      const blocks = await programIntelligenceService.getBlockPerformances(req.query);
      res.json(blocks);
    } catch (error) {
      next(error);
    }
  });

  router.get("/risks", async (req, res, next) => {
    try {
      const risks = await programIntelligenceService.getRisks(req.query);
      res.json(risks);
    } catch (error) {
      next(error);
    }
  });

  router.get("/review-summary", async (req, res, next) => {
    try {
      const summary = await programIntelligenceService.getReviewSummary(req.query);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  router.get("/monthly-review", async (req, res, next) => {
    try {
      const review = await monthlyReviewService.getMonthlyReview(req.query);
      res.json(review);
    } catch (error) {
      next(error);
    }
  });

  router.get("/action-items", async (req, res, next) => {
    try {
      const payload = await actionItemService.getActionItems(req.query);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.post("/action-items/regenerate", async (req, res, next) => {
    try {
      const payload = await actionItemService.regenerateActionItems(req.query);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/action-items/:id", async (req, res, next) => {
    try {
      const updated = await actionItemService.updateActionItem(req.params.id, req.body ?? {});
      if (!updated) {
        res.status(404).json({ error: "action_not_found", message: "Action item not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
