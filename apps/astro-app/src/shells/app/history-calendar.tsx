"use client";

import { useMemo, useState } from "react";
import {
  Amount,
  CalendarLegend,
  ConfirmDialog,
  ListGroupHeader,
  MonthCalendar,
  RecordCard,
  type CalendarEntry,
} from "@/components/shared";
import { SkeletonList } from "@/libs/ui/skeleton";
import { cn } from "@/libs/ui/utils";
import { formatCurrency, formatDate } from "@/shared/format";
import { monthBounds, todayIso } from "@/shared/domain/calendar";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { useDeleteExpense } from "@/modules/expense-management/core/store";
import { EditExpenseDialog } from "@/modules/expense-management/presentation/edit-expense-dialog";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import type { RecurringPaymentActions } from "@/modules/recurring-payments/core/use-recurring-payment-actions";
import { projectOccurrences } from "@/modules/recurring-payments/core/projection";
import { Plus } from "lucide-react";

interface HistoryCalendarProps {
  expenses: Expense[];
  /** Owned by History, so both views drive the same one set of dialogs. */
  recurringActions: RecurringPaymentActions;
  /** Opens the add-expense dialog seeded with a date. */
  onAddExpense: (date: string) => void;
}

/**
 * The month, both directions.
 *
 * Backwards it is a record: every expense already logged, on the day it
 * happened. Forwards it is a schedule: the recurring payments projected onto
 * the days they will land. Same grid, one ink per category, filled for spent
 * and outlined for due — and the boundary between them is today, not a tab the
 * reader has to find.
 *
 * A recurring payment stops being a projection the moment it posts (the API
 * logs it as a real expense and advances the template), so past months carry
 * no scheduled entries and nothing is ever counted twice.
 *
 * The selected day opens below the grid rather than in a dialog: it is the
 * answer to the click, and an answer that covers the question you clicked from
 * makes you dismiss it to compare two days.
 */
export function HistoryCalendar({
  expenses,
  recurringActions,
  onAddExpense,
}: HistoryCalendarProps) {
  const today = todayIso();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const recurringQuery = useRecurringPayments();
  const deleteExpense = useDeleteExpense();
  const { hexFor } = useCategoryOptions();

  const expensesByDay = useMemo(() => {
    const byDay = new Map<string, Expense[]>();
    for (const expense of expenses) {
      if (!expense.date.startsWith(month)) continue;
      byDay.set(expense.date, [...(byDay.get(expense.date) ?? []), expense]);
    }
    return byDay;
  }, [expenses, month]);

  const scheduledByDay = useMemo(() => {
    const { from, to } = monthBounds(month);
    const byDay = new Map<string, RecurringPayment[]>();
    for (const occurrence of projectOccurrences(
      recurringQuery.data ?? [],
      from,
      to,
    )) {
      byDay.set(occurrence.date, [
        ...(byDay.get(occurrence.date) ?? []),
        occurrence.recurring,
      ]);
    }
    return byDay;
  }, [recurringQuery.data, month]);

  const entriesByDay = useMemo(() => {
    const byDay = new Map<string, CalendarEntry[]>();
    for (const [date, dayExpenses] of expensesByDay) {
      byDay.set(
        date,
        dayExpenses.map((expense) => ({
          id: `expense-${expense.id}`,
          label: expense.provider_name,
          amount: expense.amount,
          tone: "logged" as const,
          color: hexFor(expense.category),
        })),
      );
    }
    for (const [date, payments] of scheduledByDay) {
      byDay.set(date, [
        ...(byDay.get(date) ?? []),
        ...payments.map((payment) => ({
          id: `recurring-${payment.id}`,
          label: payment.provider_name,
          amount: payment.amount,
          tone: "scheduled" as const,
          color: hexFor(payment.category),
        })),
      ]);
    }
    return byDay;
  }, [expensesByDay, scheduledByDay, hexFor]);

  const monthSpend = useMemo(() => {
    let total = 0;
    for (const dayExpenses of expensesByDay.values()) {
      for (const expense of dayExpenses) total += expense.amount;
    }
    return total;
  }, [expensesByDay]);

  const monthDue = useMemo(() => {
    let total = 0;
    for (const payments of scheduledByDay.values()) {
      for (const payment of payments) total += payment.amount;
    }
    return total;
  }, [scheduledByDay]);

  // Moving month moves the selection with it, so the panel below always
  // answers for the month on screen.
  const handleMonthChange = (next: string) => {
    setMonth(next);
    setSelectedDate(next === today.slice(0, 7) ? today : `${next}-01`);
  };

  const dayExpenses = expensesByDay.get(selectedDate) ?? [];
  const dayScheduled = scheduledByDay.get(selectedDate) ?? [];
  const dayCount = dayExpenses.length + dayScheduled.length;

  const handleConfirmDeleteExpense = () => {
    if (!deletingExpense) return;
    deleteExpense.mutate(deletingExpense.id, {
      onSuccess: () => setDeletingExpense(null),
    });
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

      <section className="flex flex-col gap-3">
        <ListGroupHeader
          title={formatDate(selectedDate)}
          total={
            dayExpenses.length > 0
              ? `Total: ${formatCurrency(
                  dayExpenses.reduce((sum, item) => sum + item.amount, 0),
                )}`
              : undefined
          }
          meta={
            dayCount > 0 && `${dayCount} ${dayCount === 1 ? "item" : "items"}`
          }
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dayExpenses.map((expense) => (
            <RecordCard
              key={expense.id}
              name={expense.provider_name}
              amount={expense.amount}
              category={expense.category}
              meta={formatDate(expense.date)}
              note={expense.description}
              onOpen={() => setEditingExpense(expense)}
              openLabel={`Edit expense from ${expense.provider_name}`}
            />
          ))}

          {dayScheduled.map((payment) => (
            <RecordCard
              key={payment.id}
              name={payment.provider_name}
              amount={payment.amount}
              category={payment.category}
              categorySuffix={`· ${FREQUENCY_LABELS[payment.frequency]}`}
              meta={`Due ${formatDate(selectedDate)}`}
              note={payment.description}
              onOpen={() => recurringActions.openEdit(payment)}
              openLabel={`Edit recurring payment ${payment.provider_name}`}
              flag="Recurring"
            />
          ))}

          {/* The empty day is not a dead end: the add lives where the gap is. */}
          <button
            type="button"
            onClick={() => onAddExpense(selectedDate)}
            className={cn(
              "flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3.5 text-sm",
              "text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-accent">
              <Plus className="size-4" />
            </span>
            <span className="text-center">
              <span className="block font-medium">Add expense</span>
              <span className="block text-xs">
                for {formatDate(selectedDate)}
              </span>
            </span>
          </button>
        </div>

        {selectedDate >= today && (
          <button
            type="button"
            onClick={() => recurringActions.openCreateOn(selectedDate)}
            className="self-start text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            + New recurring payment due this day
          </button>
        )}
      </section>

      <EditExpenseDialog
        expense={editingExpense}
        onOpenChange={(open) => {
          if (!open) setEditingExpense(null);
        }}
        onRequestDelete={(expense) => {
          setEditingExpense(null);
          setDeletingExpense(expense);
        }}
      />

      <ConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) setDeletingExpense(null);
        }}
        title="Delete expense?"
        description={
          deletingExpense && (
            <>
              This will permanently remove the{" "}
              <Amount value={deletingExpense.amount} size="inherit" /> expense
              from{" "}
              <span className="font-medium text-foreground">
                {deletingExpense.provider_name}
              </span>
              .
            </>
          )
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        onConfirm={handleConfirmDeleteExpense}
        isPending={deleteExpense.isPending}
        error={deleteExpense.error}
        errorFallback="Failed to delete expense"
      />
    </div>
  );
}
