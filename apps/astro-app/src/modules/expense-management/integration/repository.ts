import { apiRequest } from "@/libs/api/api-client";
import type {
  CreateExpenseInput,
  CreateExpenseResult,
  ListExpensesResult,
  UpdateExpenseResult,
  DeleteExpenseResult,
  SuggestCategoryResult,
} from "@/shared/server-contracts/schemas/expense";
import type { Expense } from "../domain/expense";
import type { Category } from "../domain/category";

export interface ExpenseFormData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

const toPayload = (formData: ExpenseFormData): CreateExpenseInput => ({
  amount: formData.amount,
  date: formData.date,
  providerName: formData.providerName.trim(),
  description: formData.description?.trim() || null,
  category: formData.category,
});

export const getExpenses = async (signal?: AbortSignal): Promise<Expense[]> => {
  const response = await apiRequest<ListExpensesResult>("/api/expenses/list", {
    signal,
    fallbackError: "Failed to fetch expenses",
  });
  // Rows carry category as plain string; the domain narrows it to Category.
  return response.data as Expense[];
};

export const createExpense = async (
  formData: ExpenseFormData,
  signal?: AbortSignal,
) => {
  return apiRequest<CreateExpenseResult>("/api/expenses/create", {
    method: "POST",
    body: toPayload(formData),
    signal,
    fallbackError: "Failed to save expense",
  });
};

export const updateExpense = async (
  id: string,
  formData: ExpenseFormData,
  signal?: AbortSignal,
) => {
  return apiRequest<UpdateExpenseResult>(`/api/expenses/${id}`, {
    method: "PUT",
    body: toPayload(formData),
    signal,
    fallbackError: "Failed to update expense",
  });
};

export const deleteExpense = async (id: string, signal?: AbortSignal) => {
  return apiRequest<DeleteExpenseResult>(`/api/expenses/${id}`, {
    method: "DELETE",
    signal,
    fallbackError: "Failed to delete expense",
  });
};

export const suggestCategoryApi = async (
  providerName: string,
  signal?: AbortSignal,
): Promise<{ category: Category }> => {
  const response = await apiRequest<SuggestCategoryResult>(
    "/api/expenses/suggest-category",
    {
      method: "POST",
      body: { providerName },
      signal,
      fallbackError: "Failed to suggest category",
    },
  );
  return { category: response.category as Category };
};
