import "dotenv/config";
import {
  EvidenceMediaModel,
  GrantFinanceModel,
  GrantPerformanceModel,
  SchoolResponseModel,
} from "../models/index.js";
import { connectDatabase, disconnectDatabase } from "../db/connect.js";
import { loadEnv } from "../config/env.js";
import {
  assertUniqueSchoolMonthKeys,
  loadEvidenceMediaDocuments,
  loadGrantFinanceDocuments,
  loadGrantPerformanceDocuments,
  loadSchoolResponseDocuments,
} from "../lib/mappers.js";

interface CollectionSeedResult {
  collection: string;
  deleted: number;
  inserted: number;
}

async function seedCollection(
  collection: string,
  deleteMany: () => Promise<{ deletedCount?: number }>,
  insertMany: (docs: object[]) => Promise<unknown>,
  documents: object[],
): Promise<CollectionSeedResult> {
  const deleteResult = await deleteMany();
  const deleted = deleteResult.deletedCount ?? 0;

  if (documents.length > 0) {
    await insertMany(documents);
  }

  return { collection, deleted, inserted: documents.length };
}

async function seed(): Promise<void> {
  const env = loadEnv();
  await connectDatabase(env);

  console.log("=== Mantra4Change Data Seed ===");
  console.log("Mode: clear + reload (idempotent)\n");

  const { documents: schoolDocs, fileSummaries } = loadSchoolResponseDocuments();
  const financeDocs = loadGrantFinanceDocuments();
  const performanceDocs = loadGrantPerformanceDocuments();
  const evidenceDocs = loadEvidenceMediaDocuments();

  console.log("CSV files loaded:");
  for (const summary of fileSummaries) {
    console.log(`  SchoolResponse <- ${summary.fileName}: ${summary.rowCount} rows`);
  }
  console.log(`  GrantFinance <- ${financeDocs.length} rows`);
  console.log(`  GrantPerformance <- ${performanceDocs.length} rows`);
  console.log(`  EvidenceMedia <- ${evidenceDocs.length} rows\n`);

  assertUniqueSchoolMonthKeys(schoolDocs);
  console.log("Validation passed: one row per school per reporting month.\n");

  const results = await Promise.all([
    seedCollection(
      "SchoolResponse",
      () => SchoolResponseModel.deleteMany({}),
      (docs) => SchoolResponseModel.insertMany(docs, { ordered: true }),
      schoolDocs,
    ),
    seedCollection(
      "GrantFinance",
      () => GrantFinanceModel.deleteMany({}),
      (docs) => GrantFinanceModel.insertMany(docs, { ordered: true }),
      financeDocs,
    ),
    seedCollection(
      "GrantPerformance",
      () => GrantPerformanceModel.deleteMany({}),
      (docs) => GrantPerformanceModel.insertMany(docs, { ordered: true }),
      performanceDocs,
    ),
    seedCollection(
      "EvidenceMedia",
      () => EvidenceMediaModel.deleteMany({}),
      (docs) => EvidenceMediaModel.insertMany(docs, { ordered: true }),
      evidenceDocs,
    ),
  ]);

  console.log("Collection counts:");
  for (const result of results) {
    console.log(
      `  ${result.collection}: deleted ${result.deleted}, inserted ${result.inserted}`,
    );
  }

  const verified = await Promise.all([
    SchoolResponseModel.countDocuments(),
    GrantFinanceModel.countDocuments(),
    GrantPerformanceModel.countDocuments(),
    EvidenceMediaModel.countDocuments(),
  ]);

  console.log("\nMongoDB verification:");
  console.log(`  SchoolResponse: ${verified[0]}`);
  console.log(`  GrantFinance: ${verified[1]}`);
  console.log(`  GrantPerformance: ${verified[2]}`);
  console.log(`  EvidenceMedia: ${verified[3]}`);
  console.log("\nSeed complete ?");

  await disconnectDatabase();
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
