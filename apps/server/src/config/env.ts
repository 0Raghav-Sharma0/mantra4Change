import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/mantra4change"),
  ANALYTICS_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  /** Preferred flag; `AI_ENABLED` is accepted as a legacy alias. */
  ENABLE_AI_NARRATIVE: z.enum(["true", "false"]).optional(),
  AI_ENABLED: z.enum(["true", "false"]).optional(),
  AI_API_KEY: z.preprocess(
    (value) => {
      const key = value ?? process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;
      return key === "" ? undefined : key;
    },
    z.string().optional(),
  ),
  /** OpenAI-compatible model id (e.g. gemini-2.5-flash, gpt-4o-mini). */
  AI_MODEL: z.string().default("gemini-2.5-flash"),
  AI_BASE_URL: z
    .preprocess(
      (value) => (value === "" || value === undefined ? undefined : value),
      z.string().url().optional(),
    ),
  /** Optional alias; merged into AI_API_KEY when AI_API_KEY is unset. */
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  GRANT_EVIDENCE_PATH: z.string().default("../../data/grant/images"),
});

export type Env = Omit<
  z.infer<typeof envSchema>,
  "ENABLE_AI_NARRATIVE" | "AI_ENABLED" | "GEMINI_API_KEY"
> & {
  AI_ENABLED: boolean;
};

function resolveAiEnabled(raw: z.infer<typeof envSchema>): boolean {
  const flag = raw.ENABLE_AI_NARRATIVE ?? raw.AI_ENABLED ?? "false";
  return flag === "true";
}

export function loadEnv(): Env {
  const parsed = envSchema.parse(process.env);
  const { ENABLE_AI_NARRATIVE: _enableAiNarrative, AI_ENABLED: _aiEnabled, GEMINI_API_KEY: _gemini, ...rest } =
    parsed;
  return {
    ...rest,
    AI_ENABLED: resolveAiEnabled(parsed),
  };
}
