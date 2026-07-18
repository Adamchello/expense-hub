import type {
  RecurringBill,
  RecurringBillEvent,
} from "@/modules/recurring-bills/domain/recurring-bill";
import { monthBounds, projectOccurrences } from "./projection";

export type OccurrenceStatus = "upcoming" | "overdue" | "paid" | "skipped";

export interface ChecklistItem {
  key: string;
  recurringId: string;
  provider: string;
  amount: number;
  category: string;
  dueDate: string;
  status: OccurrenceStatus;
  /** Only actionable while the occurrence is the bill's current next due date. */
  actionable: boolean;
}

/**
 * The month's payment checklist: settled occurrences (paid/skipped events)
 * merged with still-open ones projected from current schedules.
 */
export function buildMonthlyChecklist(
  recurringBills: RecurringBill[],
  events: RecurringBillEvent[],
  month: string,
  today: string,
): ChecklistItem[] {
  const byId = new Map(recurringBills.map((bill) => [bill.id, bill]));
  const { from, to } = monthBounds(month);

  const settled: ChecklistItem[] = events
    .filter((event) => event.due_date >= from && event.due_date <= to)
    .flatMap((event) => {
      const bill = byId.get(event.recurring_id);
      if (!bill) return []; // recurring bill was deleted; nothing to display
      return [
        {
          key: `${event.recurring_id}-${event.due_date}`,
          recurringId: event.recurring_id,
          provider: bill.provider_name,
          amount: bill.amount,
          category: bill.category,
          dueDate: event.due_date,
          status: event.status,
          actionable: false,
        },
      ];
    });

  const settledKeys = new Set(settled.map((item) => item.key));

  const open: ChecklistItem[] = projectOccurrences(recurringBills, from, to)
    .filter(
      (occurrence) =>
        !settledKeys.has(`${occurrence.recurring.id}-${occurrence.date}`),
    )
    .map((occurrence) => ({
      key: `${occurrence.recurring.id}-${occurrence.date}`,
      recurringId: occurrence.recurring.id,
      provider: occurrence.recurring.provider_name,
      amount: occurrence.recurring.amount,
      category: occurrence.recurring.category,
      dueDate: occurrence.date,
      status: occurrence.date < today ? "overdue" : "upcoming",
      // Log/Skip always act on the bill's CURRENT next due date.
      actionable: occurrence.date === occurrence.recurring.next_due_date,
    }));

  return [...settled, ...open].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.provider.localeCompare(b.provider),
  );
}
