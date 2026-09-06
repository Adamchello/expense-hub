import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import { withOptimisticList, temporaryId } from "@/libs/api/optimistic-list";
import { toast } from "@/libs/ui/toast";
import {
  compareRecurringSoonestFirst,
  type RecurringPayment,
  type RecurringPaymentFormData,
} from "../domain/recurring-payment";
import { recurringPaymentFromForm } from "../integration/mappers";
import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} from "../integration/repository";

const RECURRING_KEY = ["recurring-payments"];

export function useRecurringPayments(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: RECURRING_KEY,
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
    withOptimisticList(
      {
        mutationFn: (formData: RecurringPaymentFormData) =>
          createRecurringPayment(formData),
        onSuccess: () => {
          toast("Recurring payment created");
        },
      },
      {
        queryKey: RECURRING_KEY,
        apply: (payments: RecurringPayment[], formData) =>
          [
            {
              id: temporaryId(),
              created_at: new Date().toISOString(),
              ...recurringPaymentFromForm(formData),
            },
            ...payments,
          ].sort(compareRecurringSoonestFirst),
      },
    ),
    queryClient,
  );
}

export function useUpdateRecurringPayment() {
  return useMutation(
    withOptimisticList(
      {
        mutationFn: (input: {
          id: string;
          formData: RecurringPaymentFormData;
        }) => updateRecurringPayment(input.id, input.formData),
        onSuccess: () => {
          toast("Recurring payment updated");
        },
      },
      {
        queryKey: RECURRING_KEY,
        apply: (payments: RecurringPayment[], { id, formData }) =>
          payments
            .map((payment) =>
              payment.id === id
                ? { ...payment, ...recurringPaymentFromForm(formData) }
                : payment,
            )
            .sort(compareRecurringSoonestFirst),
      },
    ),
    queryClient,
  );
}

export function useDeleteRecurringPayment() {
  return useMutation(
    withOptimisticList(
      {
        mutationFn: (id: string) => deleteRecurringPayment(id),
        onSuccess: () => {
          toast("Recurring payment deleted");
        },
      },
      {
        queryKey: RECURRING_KEY,
        apply: (payments: RecurringPayment[], id) =>
          payments.filter((payment) => payment.id !== id),
        errorMessage: "Failed to delete recurring payment",
      },
    ),
    queryClient,
  );
}
