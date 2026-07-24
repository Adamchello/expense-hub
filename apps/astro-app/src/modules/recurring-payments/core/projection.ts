import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import { advanceDueDate } from "@/shared/domain/recurrence";

export interface ProjectedOccurrence {
  /** YYYY-MM-DD the occurrence falls due. */
  date: string;
  recurring: RecurringPayment;
}

/** Safety cap: a daily-ish cadence never needs more within one window. */
const MAX_OCCURRENCES_PER_PAYMENT = 62;

/**
 * Projects recurring-payment occurrences inside [from, to] (inclusive, YYYY-MM-DD).
 * Not a prediction — it simply unrolls each payment's schedule.
 */
export function projectOccurrences(
  expenses: RecurringPayment[],
  from: string,
  to: string,
): ProjectedOccurrence[] {
  const occurrences: ProjectedOccurrence[] = [];

  for (const expense of expenses) {
    let date = expense.next_due_date;
    let guard = 0;
    while (date <= to && guard < MAX_OCCURRENCES_PER_PAYMENT) {
      if (date >= from) {
        occurrences.push({ date, recurring: expense });
      }
      date = advanceDueDate(date, expense.frequency);
      guard++;
    }
  }

  return occurrences.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.recurring.provider_name.localeCompare(b.recurring.provider_name),
  );
}

export const expectedTotal = (occurrences: ProjectedOccurrence[]): number =>
  occurrences.reduce((sum, occurrence) => sum + occurrence.recurring.amount, 0);

// Calendar arithmetic is not a recurring-payments concern — the History
// calendar plots logged expenses on the same grid. It lives in shared/domain
// and is re-exported here so this module's callers keep one import.
export { addDays, monthBounds, shiftMonth } from "@/shared/domain/calendar";
