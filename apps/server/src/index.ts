import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";
import { createApp, resolveEvidenceDir } from "./app.js";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  await connectDatabase(env);

  const app = createApp(env);

  app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
    console.log(`Evidence static path: ${resolveEvidenceDir(env)}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
