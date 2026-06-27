import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export interface CsvReadOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
}

export function readCsvFile(
  filePath: string,
  options: CsvReadOptions = {},
): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: options.skipEmptyLines ?? true,
    delimiter: options.delimiter ?? ",",
    trim: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  return records;
}

export function listCsvFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".csv"))
    .map((file) => path.join(directory, file));
}

export function parseNumber(value: string | undefined, fallback = 0): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseSemicolonList(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
