import type { CustomCategory } from "../domain/custom-category";

export const getCustomCategories = async (
  signal?: AbortSignal,
): Promise<CustomCategory[]> => {
  const response = await fetch("/api/categories", { signal });
  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return data.data || [];
};

export const createCustomCategory = async (
  input: { name: string; color: string },
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create category");
  return data;
};

export const deleteCustomCategory = async (
  id: string,
  signal?: AbortSignal,
) => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to delete category");
  return data;
};
