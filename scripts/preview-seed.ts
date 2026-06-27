/**
 * Preview CSV row counts without connecting to MongoDB.
 * Run: npx tsx scripts/preview-seed.ts
 */
import { summarizeSeedData } from "./import-helpers.js";

const summary = summarizeSeedData();
console.log("Seed preview (CSV rows):", summary);
