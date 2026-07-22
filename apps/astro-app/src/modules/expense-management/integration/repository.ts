import type { Expense } from "../domain/expense";
import type { Category } from "../domain/category";

export interface ExpenseFormData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

export const getExpenses = async (signal?: AbortSignal): Promise<Expense[]> => {
  const response = await fetch("/api/expenses/list", { signal });
  if (!response.ok) throw new Error("Failed to fetch expenses");
  const data = await response.json();
  return data.data || [];
};

export const createExpense = async (
  formData: ExpenseFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/expenses/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: formData.amount,
      date: formData.date,
      providerName: formData.providerName.trim(),
      description: formData.description?.trim() || null,
      category: formData.category,
    }),
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to save expense");
  return data;
};

export const updateExpense = async (
  id: string,
  formData: ExpenseFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: formData.amount,
      date: formData.date,
      providerName: formData.providerName.trim(),
      description: formData.description?.trim() || null,
      category: formData.category,
    }),
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update expense");
  return data;
};

export const deleteExpense = async (id: string, signal?: AbortSignal) => {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to delete expense");
  return data;
};

export const suggestCategoryApi = async (
  providerName: string,
  signal?: AbortSignal,
): Promise<{ category: Category }> => {
  const response = await fetch("/api/expenses/suggest-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerName }),
    signal,
  });
  if (!response.ok) throw new Error("Failed to suggest category");
  return response.json();
};
