import cors from "cors";
import express from "express";
import path from "node:path";
import type { Env } from "./config/env.js";
import { createApiRouter } from "./routes/index.js";
import { resolveGrantEvidenceDir } from "./lib/dataPaths.js";

export function createApp(env: Env): express.Application {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());

  const evidenceDir = resolveGrantEvidenceDir(env.GRANT_EVIDENCE_PATH);
  app.use("/evidence", express.static(evidenceDir));

  app.use("/api", createApiRouter(env));

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({
        error: "internal_error",
        message: env.NODE_ENV === "production" ? "Internal server error" : err.message,
      });
    },
  );

  return app;
}

export function resolveEvidenceDir(env: Env): string {
  return path.resolve(resolveGrantEvidenceDir(env.GRANT_EVIDENCE_PATH));
}
