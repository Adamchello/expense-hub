import type {
  RecurringPayment,
  RecurringPaymentFormData,
} from "../domain/recurring-payment";

/** The single place that decides what "clean" form input means. */
export const normalizeRecurringPaymentForm = (
  formData: RecurringPaymentFormData,
): RecurringPaymentFormData => ({
  ...formData,
  providerName: formData.providerName.trim(),
  description: formData.description?.trim() || null,
});

/** The domain row a form submission will become once the server accepts it. */
export const recurringPaymentFromForm = (
  formData: RecurringPaymentFormData,
): Omit<RecurringPayment, "id" | "created_at"> => {
  const clean = normalizeRecurringPaymentForm(formData);
  return {
    amount: clean.amount,
    provider_name: clean.providerName,
    description: clean.description,
    category: clean.category,
    frequency: clean.frequency,
    next_due_date: clean.nextDueDate,
  };
};
