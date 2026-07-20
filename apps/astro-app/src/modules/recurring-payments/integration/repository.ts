import type {
  RecurringPayment,
  RecurringPaymentFormData,
} from "../domain/recurring-payment";

const toPayload = (formData: RecurringPaymentFormData) => ({
  amount: formData.amount,
  providerName: formData.providerName.trim(),
  description: formData.description?.trim() || null,
  category: formData.category,
  frequency: formData.frequency,
  nextDueDate: formData.nextDueDate,
});

export interface RecurringPaymentsResult {
  expenses: RecurringPayment[];
  /** How many due occurrences the server just auto-logged as expenses. */
  materialized: number;
}

export const getRecurringPayments = async (
  signal?: AbortSignal,
): Promise<RecurringPaymentsResult> => {
  const response = await fetch("/api/recurring", { signal });
  if (!response.ok) throw new Error("Failed to fetch recurring payments");
  const data = await response.json();
  return {
    expenses: data.data?.expenses || [],
    materialized: data.data?.materialized ?? 0,
  };
};

export const createRecurringPayment = async (
  formData: RecurringPaymentFormData,
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
    throw new Error(data.error || "Failed to save recurring payment");
  return data;
};

export const updateRecurringPayment = async (
  id: string,
  formData: RecurringPaymentFormData,
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
    throw new Error(data.error || "Failed to update recurring payment");
  return data;
};

export const deleteRecurringPayment = async (
  id: string,
  signal?: AbortSignal,
) => {
  const response = await fetch(`/api/recurring/${id}`, {
    method: "DELETE",
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to delete recurring payment");
  return data;
};
