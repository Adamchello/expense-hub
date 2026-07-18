import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import {
  getCustomCategories,
  createCustomCategory,
  deleteCustomCategory,
} from "../integration/repository";

const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
};

export function useCustomCategories(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["custom-categories"],
      queryFn: ({ signal }) => getCustomCategories(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateCustomCategory() {
  return useMutation(
    {
      mutationFn: (input: { name: string; color: string }) =>
        createCustomCategory(input),
      onSuccess: invalidate,
    },
    queryClient,
  );
}

export function useDeleteCustomCategory() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteCustomCategory(id),
      onSuccess: invalidate,
    },
    queryClient,
  );
}
