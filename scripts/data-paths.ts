import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Monorepo root directory. */
export const REPO_ROOT = path.resolve(__dirname, "..");

/** Symlinked data directory at repo root. */
export const DATA_ROOT = path.join(REPO_ROOT, "data");

export const PBL_CSV_DIR = path.join(DATA_ROOT, "pbl", "csv_exports");

export const GRANT_CSV_DIR = path.join(DATA_ROOT, "grant", "csv");

export const GRANT_IMAGES_DIR = path.join(DATA_ROOT, "grant", "images");

export const PBL_CSV_FILES = [
  "PBL_School_Response_Data_July_2025.csv",
  "PBL_School_Response_Data_August_2025.csv",
  "PBL_School_Response_Data_September_2025.csv",
] as const;

export const GRANT_CSV_FILES = {
  finance: "01_Grant_Profile_and_Finance.csv",
  performance: "02_Grant_Performance_and_Report_Material.csv",
  evidence: "03_Evidence_and_Media_Index.csv",
} as const;

export function pblCsvPath(fileName: string): string {
  return path.join(PBL_CSV_DIR, fileName);
}

export function grantCsvPath(fileName: string): string {
  return path.join(GRANT_CSV_DIR, fileName);
}

export function grantImagePath(relativePath: string): string {
  return path.join(DATA_ROOT, "grant", relativePath);
}
