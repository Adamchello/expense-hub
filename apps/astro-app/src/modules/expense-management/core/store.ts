import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import type { ExpenseFormData } from "../integration/repository";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  suggestCategoryApi,
} from "../integration/repository";

export function useExpenses(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["expenses"],
      queryFn: ({ signal }) => getExpenses(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateExpense() {
  return useMutation(
    {
      mutationFn: (formData: ExpenseFormData) => createExpense(formData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      },
    },
    queryClient,
  );
}

export function useUpdateExpense() {
  return useMutation(
    {
      mutationFn: (input: { id: string; formData: ExpenseFormData }) =>
        updateExpense(input.id, input.formData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        toast("Expense updated");
      },
    },
    queryClient,
  );
}

export function useDeleteExpense() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteExpense(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      },
    },
    queryClient,
  );
}

export function useBulkDeleteExpenses() {
  return useMutation(
    {
      mutationFn: (ids: string[]) => bulkDeleteExpenses(ids),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      },
    },
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
