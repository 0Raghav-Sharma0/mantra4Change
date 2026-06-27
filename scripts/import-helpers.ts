import {
  GRANT_CSV_FILES,
  PBL_CSV_FILES,
  grantCsvPath,
  pblCsvPath,
} from "./data-paths.js";
import { readCsvFile } from "./csv-reader.js";

export interface SeedSummary {
  schoolResponse: number;
  grantFinanceRecords: number;
  grantPerformanceRecords: number;
  evidenceMediaRecords: number;
}

export function loadAllPblRows(): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (const fileName of PBL_CSV_FILES) {
    rows.push(...readCsvFile(pblCsvPath(fileName)));
  }
  return rows;
}

export function loadGrantFinanceRows(): Record<string, string>[] {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.finance));
}

export function loadGrantPerformanceRows(): Record<string, string>[] {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.performance));
}

export function loadEvidenceMediaRows(): Record<string, string>[] {
  return readCsvFile(grantCsvPath(GRANT_CSV_FILES.evidence));
}

export function summarizeSeedData(): SeedSummary {
  return {
    schoolResponse: loadAllPblRows().length,
    grantFinanceRecords: loadGrantFinanceRows().length,
    grantPerformanceRecords: loadGrantPerformanceRows().length,
    evidenceMediaRecords: loadEvidenceMediaRows().length,
  };
}
