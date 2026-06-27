import type { Env } from "../config/env.js";
import type { ChartFilterRequest, ChartResponse } from "@mantra4change/shared-types";

export interface AnalyticsHealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export class AnalyticsClient {
  constructor(private readonly baseUrl: string) {}

  static fromEnv(env: Env): AnalyticsClient {
    return new AnalyticsClient(env.ANALYTICS_SERVICE_URL);
  }

  async getHealth(): Promise<AnalyticsHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Analytics service health check failed: ${response.status}`);
    }
    return (await response.json()) as AnalyticsHealthResponse;
  }

  async postChart(endpoint: string, body: ChartFilterRequest): Promise<ChartResponse> {
    const response = await fetch(`${this.baseUrl}/charts/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Chart request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as ChartResponse;
  }

  getStaticChartUrl(pngPath: string | null): string | null {
    if (!pngPath) return null;
    const fileName = pngPath.split("/").pop();
    if (!fileName) return null;
    return `${this.baseUrl}/static/charts/${fileName}`;
  }
}
