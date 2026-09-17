"use client";

import { useMemo, useState } from "react";
import { Amount } from "@/shared/money/amount";
import {
  CalendarLegend,
  MonthCalendar,
} from "@/modules/history/presentation/month-calendar";
import { SkeletonList } from "@/libs/ui/skeleton";
import { todayIso } from "@/shared/calendar/calendar";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { useExpenseRecordActions } from "@/modules/expense-management/core/use-expense-record-actions";
import { ExpenseRecordDialogs } from "@/modules/expense-management/presentation/expense-record-dialogs";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import type { RecurringPaymentActions } from "@/modules/recurring-payments/core/use-recurring-payment-actions";
import { openAddExpense } from "@/modules/add-expense/core/intent";
import {
  groupExpensesByDay,
  groupScheduledByDay,
  sumAmounts,
  toCalendarEntries,
} from "../core/calendar-entries";
import { DayDetail } from "./day-detail";

interface HistoryCalendarProps {
  expenses: Expense[];
  /** Owned by History, so both views drive the same one set of dialogs. */
  recurringActions: RecurringPaymentActions;
}

/**
 * The month, both directions.
 *
 * Backwards it is a record: every expense already logged, on the day it
 * happened. Forwards it is a schedule: the recurring payments projected onto
 * the days they will land. Same grid, one ink per category, filled for spent
 * and outlined for due — and the boundary between them is today, not a tab the
 * reader has to find.
 */
export function HistoryCalendar({
  expenses,
  recurringActions,
}: HistoryCalendarProps) {
  const today = todayIso();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const recurringQuery = useRecurringPayments();
  const expenseActions = useExpenseRecordActions();
  const { hexFor } = useCategoryOptions();

  const expensesByDay = useMemo(
    () => groupExpensesByDay(expenses, month),
    [expenses, month],
  );
  const scheduledByDay = useMemo(
    () => groupScheduledByDay(recurringQuery.data ?? [], month),
    [recurringQuery.data, month],
  );
  const entriesByDay = useMemo(
    () => toCalendarEntries(expensesByDay, scheduledByDay, hexFor),
    [expensesByDay, scheduledByDay, hexFor],
  );
  const monthSpend = useMemo(() => sumAmounts(expensesByDay), [expensesByDay]);
  const monthDue = useMemo(() => sumAmounts(scheduledByDay), [scheduledByDay]);

  // Moving month moves the selection with it, so the panel below always
  // answers for the month on screen.
  const handleMonthChange = (next: string) => {
    setMonth(next);
    setSelectedDate(next === today.slice(0, 7) ? today : `${next}-01`);
  };

  if (recurringQuery.isLoading) {
    return <SkeletonList rows={4} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <MonthCalendar
        month={month}
        onMonthChange={handleMonthChange}
        entriesByDay={entriesByDay}
        selectedDate={selectedDate}
        onSelectDay={setSelectedDate}
        today={today}
        total={monthSpend}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <CalendarLegend
              loggedLabel="Logged expense"
              scheduledLabel="Scheduled payment"
            />
            {monthDue > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Still due this month
                <Amount value={monthDue} size="sm" />
              </span>
            )}
          </div>
        }
      />

      <DayDetail
        date={selectedDate}
        today={today}
        expenses={expensesByDay.get(selectedDate) ?? []}
        scheduled={scheduledByDay.get(selectedDate) ?? []}
        onOpenExpense={expenseActions.openEdit}
        onOpenRecurring={recurringActions.openEdit}
        onAddExpense={(date) => openAddExpense({ date })}
        onCreateRecurringOn={recurringActions.openCreateOn}
      />

      <ExpenseRecordDialogs actions={expenseActions} />
    </div>
  );
}
