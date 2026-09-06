import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import { withOptimisticList, temporaryId } from "@/libs/api/optimistic-list";
import { toast } from "@/libs/ui/toast";
import type { CreateCategoryInput } from "@/shared/server-contracts/schemas/category";
import {
  compareCategoriesByName,
  type CustomCategory,
} from "../domain/custom-category";
import { customCategoryFromInput } from "../integration/mappers";
import {
  getCustomCategories,
  createCustomCategory,
  deleteCustomCategory,
} from "../integration/repository";

const CATEGORIES_KEY = ["custom-categories"];

export function useCustomCategories(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: CATEGORIES_KEY,
      queryFn: ({ signal }) => getCustomCategories(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateCustomCategory() {
  return useMutation(
    withOptimisticList(
      {
        mutationFn: (input: CreateCategoryInput) => createCustomCategory(input),
        onSuccess: (_, input) => {
          toast(`Category "${input.name}" added`);
        },
      },
      {
        queryKey: CATEGORIES_KEY,
        apply: (categories: CustomCategory[], input) =>
          [
            ...categories,
            {
              id: temporaryId(),
              created_at: new Date().toISOString(),
              ...customCategoryFromInput(input),
            },
          ].sort(compareCategoriesByName),
      },
    ),
    queryClient,
  );
}

export function useDeleteCustomCategory() {
  return useMutation(
    withOptimisticList(
      {
        mutationFn: (id: string) => deleteCustomCategory(id),
        onSuccess: () => {
          toast("Category deleted");
        },
      },
      {
        queryKey: CATEGORIES_KEY,
        apply: (categories: CustomCategory[], id) =>
          categories.filter((category) => category.id !== id),
        errorMessage: "Failed to delete category",
      },
    ),
    queryClient,
  );
}
