import type { Bill } from "../domain/bill";
import type { Category } from "../domain/category";

export interface BillFormData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

export const getBills = async (signal?: AbortSignal): Promise<Bill[]> => {
  const response = await fetch("/api/bills/list", { signal });
  if (!response.ok) throw new Error("Failed to fetch bills");
  const data = await response.json();
  return data.data || [];
};

export const createBill = async (
  formData: BillFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/bills/create", {
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
  if (!response.ok) throw new Error(data.error || "Failed to save bill");
  return data;
};

export const updateBill = async (
  id: string,
  formData: BillFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch(`/api/bills/${id}`, {
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
  if (!response.ok) throw new Error(data.error || "Failed to update bill");
  return data;
};

export const deleteBill = async (id: string, signal?: AbortSignal) => {
  const response = await fetch(`/api/bills/${id}`, {
    method: "DELETE",
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to delete bill");
  return data;
};

export const suggestCategoryApi = async (
  providerName: string,
  signal?: AbortSignal,
): Promise<{ category: Category }> => {
  const response = await fetch("/api/bills/suggest-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerName }),
    signal,
  });
  if (!response.ok) throw new Error("Failed to suggest category");
  return response.json();
};
