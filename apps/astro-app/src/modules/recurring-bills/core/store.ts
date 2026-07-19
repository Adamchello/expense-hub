import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import type { RecurringBillFormData } from "../domain/recurring-bill";
import {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
} from "../integration/repository";

const invalidateRecurring = () => {
  queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
};

export function useRecurringBills(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["recurring-bills"],
      queryFn: async ({ signal }) => {
        const result = await getRecurringBills(signal);
        // The server may have auto-logged due occurrences as real bills.
        if (result.materialized > 0) {
          queryClient.invalidateQueries({ queryKey: ["bills"] });
        }
        return result.bills;
      },
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useCreateRecurringBill() {
  return useMutation(
    {
      mutationFn: (formData: RecurringBillFormData) =>
        createRecurringBill(formData),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring bill created");
      },
    },
    queryClient,
  );
}

export function useUpdateRecurringBill() {
  return useMutation(
    {
      mutationFn: (input: { id: string; formData: RecurringBillFormData }) =>
        updateRecurringBill(input.id, input.formData),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring bill updated");
      },
    },
    queryClient,
  );
}

export function useDeleteRecurringBill() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteRecurringBill(id),
      onSuccess: () => {
        invalidateRecurring();
        toast("Recurring bill deleted");
      },
    },
    queryClient,
  );
}
