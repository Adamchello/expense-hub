import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import { withOptimisticList, temporaryId } from "@/libs/api/optimistic-list";
import { toast } from "@/libs/ui/toast";
import {
  compareExpensesNewestFirst,
  type Expense,
  type ExpenseFormData,
} from "../domain/expense";
import { expenseFromForm } from "../integration/mappers";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  suggestCategoryApi,
} from "../integration/repository";

export const EXPENSES_KEY = ["expenses"];

export function useExpenses(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: EXPENSES_KEY,
      queryFn: ({ signal }) => getExpenses(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateExpense() {
  return useMutation(
    withOptimisticList(
      { mutationFn: (formData: ExpenseFormData) => createExpense(formData) },
      {
        queryKey: EXPENSES_KEY,
        apply: (expenses: Expense[], formData) =>
          [
            {
              id: temporaryId(),
              created_at: new Date().toISOString(),
              ...expenseFromForm(formData),
            },
            ...expenses,
          ].sort(compareExpensesNewestFirst),
      },
    ),
    queryClient,
  );
}

export function useUpdateExpense() {
  return useMutation(
    withOptimisticList(
      {
        mutationFn: (input: { id: string; formData: ExpenseFormData }) =>
          updateExpense(input.id, input.formData),
        onSuccess: () => {
          toast("Expense updated");
        },
      },
      {
        queryKey: EXPENSES_KEY,
        apply: (expenses: Expense[], { id, formData }) =>
          expenses
            .map((expense) =>
              expense.id === id
                ? { ...expense, ...expenseFromForm(formData) }
                : expense,
            )
            .sort(compareExpensesNewestFirst),
      },
    ),
    queryClient,
  );
}

export function useDeleteExpense() {
  return useMutation(
    withOptimisticList(
      { mutationFn: (id: string) => deleteExpense(id) },
      {
        queryKey: EXPENSES_KEY,
        apply: (expenses: Expense[], id) =>
          expenses.filter((expense) => expense.id !== id),
        errorMessage: "Failed to delete expense",
      },
    ),
    queryClient,
  );
}

export function useSuggestCategory(providerName: string) {
  return useQuery(
    {
      queryKey: ["suggest-category", providerName],
      queryFn: () => suggestCategoryApi(providerName),
      enabled: !!providerName,
      retry: false,
      staleTime: Infinity,
    },
    queryClient,
  );
}
