import type { Category } from "@/shared/domain/category";
import type { Frequency } from "@/shared/domain/recurrence";

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
