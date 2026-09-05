import type { Category, ParsedExpenseRow } from "../../domain/expense-import";
import type { ExtractionResult } from "@/shared/server-contracts/schemas/expense";
import { buildParsedRow } from "./row-parser";

/**
 * Model output goes through the same validation as spreadsheet cells, so the
 * review step treats both sources identically. The model's category is kept;
 * it was constrained to the user's own list server-side.
 */
export function rowsFromExtracted(
  rows: ExtractionResult["rows"],
): ParsedExpenseRow[] {
  return rows.map((row) => ({
    ...buildParsedRow({
      amount: String(row.amount),
      date: row.date,
      provider: row.providerName,
      description: row.description ?? "",
    }),
    // Custom categories are plain strings; the union type only names built-ins.
    category: row.category as Category,
  }));
}
