import type { ParsedExpenseRow } from "../../domain/expense-import";
import { parseAmount } from "../parsers/amount";
import { parseDate } from "../parsers/date";
import { parseProviderName, parseDescription } from "../parsers/text";
import type { ColumnIndices } from "./column-detection";

function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function parseRow(
  row: string[],
  columns: ColumnIndices,
): ParsedExpenseRow {
  const errors: string[] = [];

  const rawAmount = row[columns.amount] || "";
  const rawDate = row[columns.date] || "";
  const rawProvider = row[columns.provider] || "";
  const rawDescription =
    columns.description >= 0 ? row[columns.description] || "" : "";

  const amountResult = parseAmount(rawAmount);
  const dateResult = parseDate(rawDate);
  const providerResult = parseProviderName(rawProvider);
  const description = parseDescription(rawDescription);

  if (amountResult.error) errors.push(amountResult.error);
  if (dateResult.error) errors.push(dateResult.error);
  if (providerResult.error) errors.push(providerResult.error);

  return {
    id: generateId(),
    amount: amountResult.value?.toString() || rawAmount,
    date: dateResult.value || rawDate,
    providerName: providerResult.value || rawProvider,
    description,
    category: "Uncategorized",
    errors,
    isDuplicate: false,
  };
}
