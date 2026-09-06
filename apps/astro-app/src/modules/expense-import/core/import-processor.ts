import type { ParsedExpenseRow } from "../domain/expense-import";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { suggestCategory } from "@/modules/expense-management/core/category-suggestion";
import { formatCurrency } from "@/shared/format";

/** Lowercase alphanumerics only, so "PGE Obrót" and "pge-obrot" compare equal. */
const normalizeProvider = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Shorter than this and containment matches everything; require equality. */
const MIN_CONTAINMENT_LENGTH = 3;

/**
 * Provider names drift between sources: a statement says "NETFLIX.COM
 * Amsterdam", the user typed "Netflix". Treat one containing the other as
 * the same merchant; amount and date still have to match exactly.
 */
export const providersMatch = (a: string, b: string): boolean => {
  const left = normalizeProvider(a);
  const right = normalizeProvider(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const [shorter, longer] =
    left.length <= right.length ? [left, right] : [right, left];
  return shorter.length >= MIN_CONTAINMENT_LENGTH && longer.includes(shorter);
};

export function checkDuplicates(
  rows: ParsedExpenseRow[],
  existingExpenses: Expense[],
): ParsedExpenseRow[] {
  if (!existingExpenses.length) return rows;

  return rows.map((row) => {
    const duplicate = existingExpenses.find(
      (expense) =>
        parseFloat(expense.amount.toString()) === parseFloat(row.amount) &&
        expense.date === row.date &&
        providersMatch(expense.provider_name, row.providerName),
    );

    if (duplicate) {
      return {
        ...row,
        isDuplicate: true,
        duplicateOf: `${duplicate.provider_name} - ${formatCurrency(Number(duplicate.amount))} on ${duplicate.date}`,
      };
    }
    return row;
  });
}

export function validateRow(row: ParsedExpenseRow): string[] {
  const errors: string[] = [];

  if (!row.amount?.trim()) {
    errors.push("Amount is missing — enter how much was paid");
  } else if (isNaN(parseFloat(row.amount))) {
    errors.push(`Amount "${row.amount}" is not a number`);
  } else if (parseFloat(row.amount) <= 0) {
    errors.push(`Amount must be greater than zero (got ${row.amount})`);
  }

  if (!row.date) {
    errors.push("Date is missing — use YYYY-MM-DD");
  } else {
    const dateObj = new Date(row.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Date "${row.date}" is not a valid date — use YYYY-MM-DD`);
    } else if (dateObj > today) {
      errors.push(`Date ${row.date} is in the future`);
    }
  }

  if (!row.providerName?.trim()) {
    errors.push("Provider name is missing — who was this paid to?");
  }

  return errors;
}

export function updateRowField(
  row: ParsedExpenseRow,
  field: keyof ParsedExpenseRow,
  value: string,
): ParsedExpenseRow {
  const updated = { ...row, [field]: value };

  if (field === "providerName") {
    updated.category = suggestCategory(value);
  }

  updated.errors = validateRow(updated);
  return updated;
}

/** Fill in a category only where the source did not provide one. */
export function categorizeRows(rows: ParsedExpenseRow[]): ParsedExpenseRow[] {
  return rows.map((row) =>
    row.category === "Uncategorized"
      ? { ...row, category: suggestCategory(row.providerName) }
      : row,
  );
}
