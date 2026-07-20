import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import type { RecurringPaymentFormData } from "../domain/recurring-payment";
import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} from "../integration/repository";

const invalidateRecurring = () => {
  queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
};

export function useRecurringPayments(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["recurring-payments"],
      queryFn: async ({ signal }) => {
        const result = await getRecurringPayments(signal);
        // The server may have auto-logged due occurrences as real expenses.
        if (result.materialized > 0) {
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
        return result.expenses;
      },
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateRecurringPayment() {
  return useMutation(
    {
      mutationFn: (formData: RecurringPaymentFormData) =>
        createRecurringPayment(formData),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring payment created");
      },
    },
    queryClient,
  );
}

export function useUpdateRecurringPayment() {
  return useMutation(
    {
      mutationFn: (input: { id: string; formData: RecurringPaymentFormData }) =>
        updateRecurringPayment(input.id, input.formData),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring payment updated");
      },
    },
    queryClient,
  );
}

export function useDeleteRecurringPayment() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteRecurringPayment(id),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring payment deleted");
      },
    },
    queryClient,
  );
}
