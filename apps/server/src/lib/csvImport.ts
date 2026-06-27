import fs from "node:fs";
import { parse } from "csv-parse/sync";

export function readCsvFile(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  }) as Record<string, string>[];
}

export function readAllCsvFiles(directory: string, pattern = ".csv"): Record<string, string>[] {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(pattern))
    .sort();

  const rows: Record<string, string>[] = [];
  for (const file of files) {
    rows.push(...readCsvFile(`${directory}/${file}`));
  }
  return rows;
}
