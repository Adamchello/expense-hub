import type {
  RecurringBill,
  RecurringBillFormData,
} from "../domain/recurring-bill";

const toPayload = (formData: RecurringBillFormData) => ({
  amount: formData.amount,
  providerName: formData.providerName.trim(),
  description: formData.description?.trim() || null,
  category: formData.category,
  frequency: formData.frequency,
  nextDueDate: formData.nextDueDate,
});

export interface RecurringBillsResult {
  bills: RecurringBill[];
  /** How many due occurrences the server just auto-logged as bills. */
  materialized: number;
}

export const getRecurringBills = async (
  signal?: AbortSignal,
): Promise<RecurringBillsResult> => {
  const response = await fetch("/api/recurring", { signal });
  if (!response.ok) throw new Error("Failed to fetch recurring bills");
  const data = await response.json();
  return {
    bills: data.data?.bills || [],
    materialized: data.data?.materialized ?? 0,
  };
};

export const createRecurringBill = async (
  formData: RecurringBillFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/recurring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(formData)),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to save recurring bill");
  return data;
};

export const updateRecurringBill = async (
  id: string,
  formData: RecurringBillFormData,
  signal?: AbortSignal,
) => {
  const response = await fetch(`/api/recurring/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(formData)),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to update recurring bill");
  return data;
};

export const deleteRecurringBill = async (id: string, signal?: AbortSignal) => {
  const response = await fetch(`/api/recurring/${id}`, {
    method: "DELETE",
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to delete recurring bill");
  return data;
};
