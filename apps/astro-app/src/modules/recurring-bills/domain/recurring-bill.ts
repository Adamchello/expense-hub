import type { Category } from "@/shared/domain/category";
import type { Frequency } from "@/shared/domain/recurrence";

export interface RecurringBill {
  id: string;
  amount: number;
  provider_name: string;
  description: string | null;
  category: Category;
  frequency: Frequency;
  next_due_date: string;
  created_at: string;
}

export interface RecurringBillFormData {
  amount: number;
  providerName: string;
  description: string | null;
  category: Category;
  frequency: Frequency;
  nextDueDate: string;
}
