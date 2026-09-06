import type { Category } from "@/shared/categories/category";
import type { Frequency } from "@/shared/recurring/recurrence";

export interface RecurringPayment {
  id: string;
  amount: number;
  provider_name: string;
  description: string | null;
  category: Category;
  frequency: Frequency;
  next_due_date: string;
  created_at: string;
}

export interface RecurringPaymentEvent {
  id: string;
  recurring_id: string;
  due_date: string;
  status: "paid" | "skipped";
  expense_id: string | null;
  created_at: string;
}

export interface RecurringPaymentFormData {
  amount: number;
  providerName: string;
  description: string | null;
  category: Category;
  frequency: Frequency;
  nextDueDate: string;
}

/** Soonest due first, which is how every schedule view reads. */
export const compareRecurringSoonestFirst = (
  a: RecurringPayment,
  b: RecurringPayment,
) => a.next_due_date.localeCompare(b.next_due_date);
