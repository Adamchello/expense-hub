import type { ParsedExpenseRow } from "../domain/expense-import";

export const importExpenses = async (
  expenses: ParsedExpenseRow[],
  signal?: AbortSignal,
): Promise<{ imported: number }> => {
  const response = await fetch("/api/expenses/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expenses: expenses.map((expense) => ({
        amount: parseFloat(expense.amount),
        date: expense.date,
        providerName: expense.providerName,
        description: expense.description || null,
        category: expense.category,
      })),
    }),
    signal,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to import expenses");
  }

  return response.json();
};
