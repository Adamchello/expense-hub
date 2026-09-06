import type { Category } from "./category";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  provider_name: string;
  description: string | null;
  category: Category;
  created_at: string;
}

/** What the entry form and edit dialog hand over; free of ids and timestamps. */
export interface ExpenseFormData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

/** Newest spend first; same-day rows keep the order they were logged in. */
export const compareExpensesNewestFirst = (a: Expense, b: Expense) =>
  b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);
