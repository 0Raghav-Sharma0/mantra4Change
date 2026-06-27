import { Router } from "express";
import type { ChartFilterRequest } from "@mantra4change/shared-types";
import type { Env } from "../config/env.js";
import { AnalyticsClient } from "../services/analyticsClient.js";
import { chartCache } from "../services/chartCache.js";

type ChartHandler = (
  client: AnalyticsClient,
  body: ChartFilterRequest,
) => Promise<import("@mantra4change/shared-types").ChartResponse>;

const CHART_ROUTES: Record<string, ChartHandler> = {
  "program-trends": (client, body) => client.postChart("program-trends", body),
  "district-performance": (client, body) => client.postChart("district-performance", body),
  "risk-distribution": (client, body) => client.postChart("risk-distribution", body),
  "grant-utilization": (client, body) => client.postChart("grant-utilization", body),
};

function parseChartBody(body: unknown): ChartFilterRequest {
  if (!body || typeof body !== "object") return {};
  const source = body as Record<string, unknown>;
  return {
    month: typeof source.month === "string" ? source.month : undefined,
    reportingMonth: typeof source.reportingMonth === "string" ? source.reportingMonth : undefined,
    district: typeof source.district === "string" ? source.district : undefined,
    block: typeof source.block === "string" ? source.block : undefined,
    grade: typeof source.grade === "string" ? source.grade : undefined,
    subject: typeof source.subject === "string" ? source.subject : undefined,
    grantId: typeof source.grantId === "string" ? source.grantId : undefined,
    exportPng: typeof source.exportPng === "boolean" ? source.exportPng : undefined,
  };
}

export function createChartsRouter(env: Env): Router {
  const router = Router();
  const analyticsClient = AnalyticsClient.fromEnv(env);

  for (const [route, handler] of Object.entries(CHART_ROUTES)) {
    router.post(`/${route}`, async (req, res, next) => {
      try {
        const body = parseChartBody(req.body);
        const cacheKey = chartCache.buildKey(route, body);
        const cached = chartCache.get(cacheKey);
        if (cached) {
          res.json(cached);
          return;
        }

        const payload = await handler(analyticsClient, body);
        chartCache.set(cacheKey, payload);
        res.json({ ...payload, cached: false });
      } catch (error) {
        next(error);
      }
    });
  }

  router.get("/static-url", (req, res) => {
    const pngPath = typeof req.query.path === "string" ? req.query.path : null;
    res.json({
      url: analyticsClient.getStaticChartUrl(pngPath),
    });
  });

  router.get("/download", async (req, res, next) => {
    try {
      const pngPath = typeof req.query.path === "string" ? req.query.path : null;
      const staticUrl = analyticsClient.getStaticChartUrl(pngPath);
      if (!staticUrl) {
        res.status(400).json({ error: "invalid_path", message: "Chart PNG path is required" });
        return;
      }

      const response = await fetch(staticUrl);
      if (!response.ok) {
        res.status(502).json({ error: "chart_download_failed", message: "Analytics PNG unavailable" });
        return;
      }

      const fileName = pngPath?.split("/").pop() ?? "chart.png";
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
