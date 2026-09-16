import type { Expense, ExpenseFormData } from "../domain/expense";
import type { Category } from "@/shared/categories/category";

interface ApiExpense {
  id: string;
  amount: number;
  date: string;
  provider_name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export function mapExpense(raw: ApiExpense): Expense {
  return {
    id: raw.id,
    amount: raw.amount,
    date: raw.date,
    provider_name: raw.provider_name,
    description: raw.description,
    category: raw.category as Category,
    created_at: raw.created_at,
  };
}

export function mapExpenses(raw: ApiExpense[]): Expense[] {
  return raw.map(mapExpense);
}

/** The single place that decides what "clean" form input means. */
export const normalizeExpenseForm = (
  formData: ExpenseFormData,
): ExpenseFormData => ({
  ...formData,
  providerName: formData.providerName.trim(),
  description: formData.description?.trim() || null,
});

/** The domain row a form submission will become once the server accepts it. */
export const expenseFromForm = (
  formData: ExpenseFormData,
): Omit<Expense, "id" | "created_at"> => {
  const clean = normalizeExpenseForm(formData);
  return {
    amount: clean.amount,
    date: clean.date,
    provider_name: clean.providerName,
    description: clean.description,
    category: clean.category,
  };
};
