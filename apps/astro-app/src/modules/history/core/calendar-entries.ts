import type { Expense } from "@/modules/expense-management/domain/expense";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import { projectOccurrences } from "@/modules/recurring-payments/core/projection";
import { monthBounds } from "@/shared/calendar/calendar";
import type { CalendarEntry } from "@/modules/history/presentation/month-calendar";

/** Records keyed by YYYY-MM-DD. */
export type ByDay<T> = Map<string, T[]>;

const push = <T>(byDay: ByDay<T>, date: string, item: T) => {
  byDay.set(date, [...(byDay.get(date) ?? []), item]);
};

/** Logged expenses that fall inside `month` (YYYY-MM), on the day they happened. */
export function groupExpensesByDay(
  expenses: Expense[],
  month: string,
): ByDay<Expense> {
  const byDay: ByDay<Expense> = new Map();
  for (const expense of expenses) {
    if (expense.date.startsWith(month)) push(byDay, expense.date, expense);
  }
  return byDay;
}

/**
 * Recurring payments unrolled onto the days they will land inside `month`.
 * A payment stops being a projection the moment it posts (the API logs it as
 * a real expense and advances the template), so past months carry no
 * scheduled entries and nothing is ever counted twice.
 */
export function groupScheduledByDay(
  payments: RecurringPayment[],
  month: string,
): ByDay<RecurringPayment> {
  const { from, to } = monthBounds(month);
  const byDay: ByDay<RecurringPayment> = new Map();
  for (const occurrence of projectOccurrences(payments, from, to)) {
    push(byDay, occurrence.date, occurrence.recurring);
  }
  return byDay;
}

/**
 * Both halves of the month on one grid: filled for spent, outlined for due.
 * `colorFor` resolves a category to its ink so the dots can be read by colour.
 */
export function toCalendarEntries(
  expensesByDay: ByDay<Expense>,
  scheduledByDay: ByDay<RecurringPayment>,
  colorFor: (category: string) => string | undefined,
): ByDay<CalendarEntry> {
  const byDay: ByDay<CalendarEntry> = new Map();
  for (const [date, expenses] of expensesByDay) {
    byDay.set(
      date,
      expenses.map((expense) => ({
        id: `expense-${expense.id}`,
        label: expense.provider_name,
        amount: expense.amount,
        tone: "logged",
        color: colorFor(expense.category),
      })),
    );
  }
  for (const [date, payments] of scheduledByDay) {
    for (const payment of payments) {
      push(byDay, date, {
        id: `recurring-${payment.id}`,
        label: payment.provider_name,
        amount: payment.amount,
        tone: "scheduled",
        color: colorFor(payment.category),
      });
    }
  }
  return byDay;
}

/** Total amount across every day in the map. */
export function sumAmounts(byDay: ByDay<{ amount: number }>): number {
  let total = 0;
  for (const items of byDay.values()) {
    for (const item of items) total += item.amount;
  }
  return total;
}
