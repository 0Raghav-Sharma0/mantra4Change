import { createHash } from "node:crypto";
import type { ChartFilterRequest, ChartResponse } from "@mantra4change/shared-types";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  payload: ChartResponse;
}

export class ChartCache {
  private readonly store = new Map<string, CacheEntry>();

  buildKey(chartType: string, filters: ChartFilterRequest): string {
    const normalized = Object.keys(filters)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const value = filters[key as keyof ChartFilterRequest];
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {});

    const raw = JSON.stringify({ chartType, filters: normalized });
    return createHash("sha256").update(raw).digest("hex");
  }

  get(key: string): ChartResponse | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return { ...entry.payload, cached: true };
  }

  set(key: string, payload: ChartResponse): void {
    this.store.set(key, {
      expiresAt: Date.now() + TTL_MS,
      payload: { ...payload, cached: false },
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export const chartCache = new ChartCache();
