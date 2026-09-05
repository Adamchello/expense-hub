import type { GridResult } from "../../domain/expense-import";
import { readCsvGrid } from "./csv";
import { readExcelGrid } from "./excel";

export { readFileAsBase64 } from "./pdf";

const extensionOf = (file: File) =>
  file.name.toLowerCase().substring(file.name.lastIndexOf("."));

export const isPdf = (file: File) =>
  extensionOf(file) === ".pdf" || file.type === "application/pdf";

/** Spreadsheet → string grid. No interpretation of columns happens here. */
export async function readGrid(file: File): Promise<GridResult> {
  const extension = extensionOf(file);
  if (extension === ".csv" || file.type === "text/csv")
    return readCsvGrid(file);
  if (extension === ".xlsx" || extension === ".xls") return readExcelGrid(file);
  return { success: false, errors: ["Unsupported file format."] };
}
