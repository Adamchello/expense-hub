import { apiRequest } from "@/libs/api/api-client";
import type {
  ListRecurringResult,
  CreateRecurringInput,
  CreateRecurringResult,
  UpdateRecurringResult,
  DeleteRecurringResult,
} from "@/shared/server-contracts/schemas/recurring";
import type {
  RecurringPayment,
  RecurringPaymentFormData,
} from "../domain/recurring-payment";
import { normalizeRecurringPaymentForm } from "./mappers";

const toPayload = (formData: RecurringPaymentFormData): CreateRecurringInput =>
  normalizeRecurringPaymentForm(formData);

export interface RecurringPaymentsResult {
  expenses: RecurringPayment[];
  /** How many due occurrences the server just auto-logged as expenses. */
  materialized: number;
}

export const getRecurringPayments = async (
  signal?: AbortSignal,
): Promise<RecurringPaymentsResult> => {
  const response = await apiRequest<ListRecurringResult>("/api/recurring", {
    signal,
    fallbackError: "Failed to fetch recurring payments",
  });
  return {
    // Rows carry category/frequency as plain strings; the domain narrows them.
    expenses: response.data.expenses as RecurringPayment[],
    materialized: response.data.materialized,
  };
};

export const createRecurringPayment = async (
  formData: RecurringPaymentFormData,
  signal?: AbortSignal,
) => {
  return apiRequest<CreateRecurringResult>("/api/recurring", {
    method: "POST",
    body: toPayload(formData),
    signal,
    fallbackError: "Failed to save recurring payment",
  });
};

export const updateRecurringPayment = async (
  id: string,
  formData: RecurringPaymentFormData,
  signal?: AbortSignal,
) => {
  return apiRequest<UpdateRecurringResult>(`/api/recurring/${id}`, {
    method: "PUT",
    body: toPayload(formData),
    signal,
    fallbackError: "Failed to update recurring payment",
  });
};

export const deleteRecurringPayment = async (
  id: string,
  signal?: AbortSignal,
) => {
  return apiRequest<DeleteRecurringResult>(`/api/recurring/${id}`, {
    method: "DELETE",
    signal,
    fallbackError: "Failed to delete recurring payment",
  });
};
