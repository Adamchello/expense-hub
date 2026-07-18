import type { RecurringBill } from "@/modules/recurring-bills/domain/recurring-bill";
import { advanceDueDate } from "@/shared/domain/recurrence";

export interface ProjectedOccurrence {
  /** YYYY-MM-DD the occurrence falls due. */
  date: string;
  recurring: RecurringBill;
}

/** Safety cap: a daily-ish cadence never needs more within one window. */
const MAX_OCCURRENCES_PER_BILL = 62;

/**
 * Projects recurring-bill occurrences inside [from, to] (inclusive, YYYY-MM-DD).
 * Not a prediction — it simply unrolls each bill's schedule.
 */
export function projectOccurrences(
  bills: RecurringBill[],
  from: string,
  to: string,
): ProjectedOccurrence[] {
  const occurrences: ProjectedOccurrence[] = [];

  for (const bill of bills) {
    let date = bill.next_due_date;
    let guard = 0;
    while (date <= to && guard < MAX_OCCURRENCES_PER_BILL) {
      if (date >= from) {
        occurrences.push({ date, recurring: bill });
      }
      date = advanceDueDate(date, bill.frequency);
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
