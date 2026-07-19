import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import type { RecurringBillFormData } from "../domain/recurring-bill";
import {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  logRecurringBill,
  skipRecurringBill,
  getRecurringEvents,
} from "../integration/repository";

const invalidateRecurring = () => {
  queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
};

export function useRecurringBills(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ["recurring-bills"],
      queryFn: ({ signal }) => getRecurringBills(signal),
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

export function useLogRecurringBill() {
  return useMutation(
    {
      mutationFn: (id: string) => logRecurringBill(id),
      onSuccess: () => {
        invalidateRecurring();
        queryClient.invalidateQueries({ queryKey: ["bills"] });
        queryClient.invalidateQueries({ queryKey: ["recurring-events"] });
        toast("Bill logged to history");
      },
    },
    queryClient,
  );
}

export function useSkipRecurringBill() {
  return useMutation(
    {
      mutationFn: (id: string) => skipRecurringBill(id),
      onSuccess: () => {
        invalidateRecurring();
        queryClient.invalidateQueries({ queryKey: ["recurring-events"] });
        toast("Occurrence skipped");
      },
    },
    queryClient,
  );
}

export function useRecurringEvents(from: string, to: string) {
  return useQuery(
    {
      queryKey: ["recurring-events", from, to],
      queryFn: ({ signal }) => getRecurringEvents(from, to, signal),
    },
    queryClient,
  );
}
