import type { ParsedExpenseRow } from "../../domain/expense-import";
import { parseAmount } from "../parsers/amount";
import { parseDate } from "../parsers/date";
import { parseProviderName, parseDescription } from "../parsers/text";
import type { ColumnIndices } from "./column-detection";

function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** The four raw strings every source boils down to before validation. */
export interface RawExpenseFields {
  amount: string;
  date: string;
  provider: string;
  description: string;
}

/** Single validation path for spreadsheet cells and model output alike. */
export function buildParsedRow(raw: RawExpenseFields): ParsedExpenseRow {
  const errors: string[] = [];

  const amountResult = parseAmount(raw.amount);
  const dateResult = parseDate(raw.date);
  const providerResult = parseProviderName(raw.provider);
  const description = parseDescription(raw.description);

  if (amountResult.error) errors.push(amountResult.error);
  if (dateResult.error) errors.push(dateResult.error);
  if (providerResult.error) errors.push(providerResult.error);

  return {
    id: generateId(),
    amount: amountResult.value?.toString() || raw.amount,
    date: dateResult.value || raw.date,
    providerName: providerResult.value || raw.provider,
    description,
    category: "Uncategorized",
    errors,
    isDuplicate: false,
  };
}

export function parseRow(
  row: string[],
  columns: ColumnIndices,
): ParsedExpenseRow {
  return buildParsedRow({
    amount: row[columns.amount] || "",
    date: row[columns.date] || "",
    provider: row[columns.provider] || "",
    description: columns.description >= 0 ? row[columns.description] || "" : "",
  });
}
