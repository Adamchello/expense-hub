import type { Expense } from "../domain/expense";
import type { Category } from "../domain/category";

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
