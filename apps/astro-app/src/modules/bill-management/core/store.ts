import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import type { BillFormData } from "../integration/repository";
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  suggestCategoryApi,
} from "../integration/repository";

export function useBills(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["bills"],
      queryFn: ({ signal }) => getBills(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateBill() {
  return useMutation(
    {
      mutationFn: (formData: BillFormData) => createBill(formData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      },
    },
    queryClient,
  );
}

export function useUpdateBill() {
  return useMutation(
    {
      mutationFn: (input: { id: string; formData: BillFormData }) =>
        updateBill(input.id, input.formData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      },
    },
    queryClient,
  );
}

export function useDeleteBill() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteBill(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["bills"] });
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
