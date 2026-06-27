import type { HealthResponse } from "@mantra4change/shared-types";
import { apiGet } from "./http";

export interface FullHealthResponse extends HealthResponse {
  dependencies?: {
    mongodb: string;
    analytics: string;
    ai: "enabled" | "disabled";
  };
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/health");
}

export function fetchFullHealth(): Promise<FullHealthResponse> {
  return apiGet<FullHealthResponse>("/api/health/full");
}
