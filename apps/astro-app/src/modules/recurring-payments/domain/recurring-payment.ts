import type { Category } from "@/shared/categories/category";
import {
  FREQUENCIES,
  type Frequency,
} from "@/shared/server-contracts/base/recurring-payment";

export { FREQUENCIES, type Frequency };

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

/** Adds months, clamping to the last day of the target month (Jan 31 + 1mo = Feb 28). */
function addMonthsClamped(
  year: number,
  month: number,
  day: number,
  months: number,
) {
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Advances a YYYY-MM-DD date by one occurrence of the given frequency. */
export function advanceDueDate(date: string, frequency: Frequency): string {
  const [year, month, day] = date.split("-").map(Number);
  let utc: Date;

  switch (frequency) {
    case "weekly":
      utc = new Date(Date.UTC(year, month - 1, day + 7));
      break;
    case "monthly":
      utc = addMonthsClamped(year, month, day, 1);
      break;
    case "quarterly":
      utc = addMonthsClamped(year, month, day, 3);
      break;
    case "yearly":
      utc = addMonthsClamped(year, month, day, 12);
      break;
  }

  return utc.toISOString().slice(0, 10);
}

/** Whole days from `from` (YYYY-MM-DD) until `to` (YYYY-MM-DD); negative = overdue. */
export function daysUntil(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const ms = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
  return Math.round(ms / 86_400_000);
}
