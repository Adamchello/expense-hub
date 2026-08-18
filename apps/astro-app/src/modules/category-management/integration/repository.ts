import { apiRequest } from "@/libs/api/api-client";
import type {
  ListCategoriesResult,
  CreateCategoryInput,
  CreateCategoryResult,
  DeleteCategoryResult,
} from "@/shared/server-contracts/schemas/category";
import type { CustomCategory } from "../domain/custom-category";

export const getCustomCategories = async (
  signal?: AbortSignal,
): Promise<CustomCategory[]> => {
  const response = await apiRequest<ListCategoriesResult>("/api/categories", {
    signal,
    fallbackError: "Failed to fetch categories",
  });
  return response.data;
};

export const createCustomCategory = async (
  input: CreateCategoryInput,
  signal?: AbortSignal,
) => {
  return apiRequest<CreateCategoryResult>("/api/categories", {
    method: "POST",
    body: input,
    signal,
    fallbackError: "Failed to create category",
  });
};

export const deleteCustomCategory = async (
  id: string,
  signal?: AbortSignal,
) => {
  return apiRequest<DeleteCategoryResult>(`/api/categories/${id}`, {
    method: "DELETE",
    signal,
    fallbackError: "Failed to delete category",
  });
};
