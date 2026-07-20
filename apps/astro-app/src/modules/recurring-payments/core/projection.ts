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

/** First and last day (YYYY-MM-DD) of a YYYY-MM month. */
export function monthBounds(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Shifts a YYYY-MM month by a number of months. */
export function shiftMonth(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const [year, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, d + days)).toISOString().slice(0, 10);
}
