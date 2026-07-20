import type { ParseResult } from "../../domain/expense-import";
import { parseCSV } from "./csv";
import { parseExcel } from "./excel";

export async function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (extension === ".csv" || file.type === "text/csv") {
    return parseCSV(file);
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return parseExcel(file);
  }

  return { success: false, rows: [], errors: ["Unsupported file format."] };
}
