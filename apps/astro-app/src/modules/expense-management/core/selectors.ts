import type { Expense } from "../domain/expense";

/** Expenses dated inside `month` (YYYY-MM). */
export const expensesInMonth = (
  expenses: Expense[],
  month: string,
): Expense[] => expenses.filter((expense) => expense.date.startsWith(month));

/** A copy sorted newest date first. */
export const newestFirst = (expenses: Expense[]): Expense[] =>
  [...expenses].sort((a, b) => b.date.localeCompare(a.date));
