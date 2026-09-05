import { apiRequest } from "@/libs/api/api-client";
import type {
  ExtractExpensesInput,
  ExtractExpensesResult,
  ImportExpensesInput,
  ImportExpensesResult,
} from "@/shared/server-contracts/schemas/expense";
import type { ParsedExpenseRow } from "../domain/expense-import";

export const importExpenses = async (
  expenses: ParsedExpenseRow[],
  signal?: AbortSignal,
): Promise<{ imported: number }> => {
  const body: ImportExpensesInput = {
    expenses: expenses.map((expense) => ({
      amount: parseFloat(expense.amount),
      date: expense.date,
      providerName: expense.providerName,
      description: expense.description || null,
      category: expense.category,
    })),
  };

  return apiRequest<ImportExpensesResult>("/api/expenses/import", {
    method: "POST",
    body,
    signal,
    fallbackError: "Failed to import expenses",
  });
};

export const extractExpenses = async (
  input: ExtractExpensesInput,
  signal?: AbortSignal,
): Promise<ExtractExpensesResult> => {
  return apiRequest<ExtractExpensesResult>("/api/expenses/extract", {
    method: "POST",
    body: input,
    signal,
    fallbackError: "Could not read expenses from this file",
  });
};
