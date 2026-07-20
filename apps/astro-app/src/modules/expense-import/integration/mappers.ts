import type { ParsedExpenseRow } from "../domain/expense-import";

interface ExpenseImportPayload {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: string;
}

export function mapRowToPayload(row: ParsedExpenseRow): ExpenseImportPayload {
  return {
    amount: parseFloat(row.amount),
    date: row.date,
    providerName: row.providerName,
    description: row.description || null,
    category: row.category,
  };
}
