import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ChartCache } from "../services/chartCache.js";

describe("ChartCache", () => {
  it("returns the same payload for identical filter hashes", () => {
    const cache = new ChartCache();
    const key = cache.buildKey("program-trends", { month: "2025-09", district: "District A" });
    const keyDuplicate = cache.buildKey("program-trends", {
      district: "District A",
      month: "2025-09",
    });
    assert.equal(key, keyDuplicate);

    cache.set(key, {
      chartType: "program-trends",
      filters: { month: "2025-09" },
      isEmpty: false,
      plotlyFigure: {},
      pngPath: null,
      summary: {},
    });

    const hit = cache.get(key);
    assert.ok(hit);
    assert.equal(hit.cached, true);
    assert.equal(hit.chartType, "program-trends");
  });

  it("misses when key is different", () => {
    const cache = new ChartCache();
    assert.equal(cache.get("missing"), null);
  });
});
