import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import { toast } from "@/libs/ui/toast";
import type { CreateCategoryInput } from "@/shared/server-contracts/schemas/category";
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
      mutationFn: (input: CreateCategoryInput) => createCustomCategory(input),
      onSuccess: (_, input) => {
        invalidate();
        toast(`Category "${input.name}" added`);
      },
    },
    queryClient,
  );
}

export function useDeleteCustomCategory() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteCustomCategory(id),
      onSuccess: () => {
        invalidate();
        toast("Category deleted");
      },
    },
    queryClient,
  );
}
