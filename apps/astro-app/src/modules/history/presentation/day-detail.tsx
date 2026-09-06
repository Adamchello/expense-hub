"use client";

import { Plus } from "lucide-react";
import { ListGroupHeader } from "@/libs/ui/list-group-header";
import { cn } from "@/libs/ui/utils";
import { RecordCard } from "@/shared/records/record-card";
import { formatCurrency, formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/recurring/recurrence";
import type { Expense } from "@/modules/expense-management/domain/expense";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";

interface DayDetailProps {
  date: string;
  today: string;
  expenses: Expense[];
  scheduled: RecurringPayment[];
  onOpenExpense: (expense: Expense) => void;
  onOpenRecurring: (payment: RecurringPayment) => void;
  onAddExpense: (date: string) => void;
  onCreateRecurringOn: (date: string) => void;
}

/**
 * The selected day, opened below the grid rather than in a dialog: it is the
 * answer to the click, and an answer that covers the question you clicked from
 * makes you dismiss it to compare two days.
 */
export function DayDetail({
  date,
  today,
  expenses,
  scheduled,
  onOpenExpense,
  onOpenRecurring,
  onAddExpense,
  onCreateRecurringOn,
}: DayDetailProps) {
  const count = expenses.length + scheduled.length;
  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="flex flex-col gap-3">
      <ListGroupHeader
        title={formatDate(date)}
        total={
          expenses.length > 0 ? `Total: ${formatCurrency(spent)}` : undefined
        }
        meta={count > 0 && `${count} ${count === 1 ? "item" : "items"}`}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {expenses.map((expense) => (
          <RecordCard
            key={expense.id}
            name={expense.provider_name}
            amount={expense.amount}
            category={expense.category}
            meta={formatDate(expense.date)}
            note={expense.description}
            onOpen={() => onOpenExpense(expense)}
            openLabel={`Edit expense from ${expense.provider_name}`}
          />
        ))}

        {scheduled.map((payment) => (
          <RecordCard
            key={payment.id}
            name={payment.provider_name}
            amount={payment.amount}
            category={payment.category}
            categorySuffix={`· ${FREQUENCY_LABELS[payment.frequency]}`}
            meta={`Due ${formatDate(date)}`}
            note={payment.description}
            onOpen={() => onOpenRecurring(payment)}
            openLabel={`Edit recurring payment ${payment.provider_name}`}
            flag="Recurring"
          />
        ))}

        {/* The empty day is not a dead end: the add lives where the gap is. */}
        <button
          type="button"
          onClick={() => onAddExpense(date)}
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
            <span className="block text-xs">for {formatDate(date)}</span>
          </span>
        </button>
      </div>

      {date >= today && (
        <button
          type="button"
          onClick={() => onCreateRecurringOn(date)}
          className="self-start text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          + New recurring payment due this day
        </button>
      )}
    </section>
  );
}
