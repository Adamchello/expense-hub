"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/shared";
import { SkeletonList } from "@/components/ui/skeleton";
import type { Expense } from "@/modules/expense-management/domain/expense";
import {
  ExpenseHistory,
  type IncomingRecord,
} from "@/modules/expense-management/presentation/expense-history";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import { useRecurringPaymentActions } from "@/modules/recurring-payments/core/use-recurring-payment-actions";
import { RecurringPaymentDialogs } from "@/modules/recurring-payments/presentation/recurring-payment-dialogs";
import { formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import { HistoryCalendar } from "./history-calendar";
import { CalendarDays, List, Plus } from "lucide-react";

/**
 * History is the whole timeline, not just the part behind you.
 *
 * Recurring payments used to live on their own page, which forced a question
 * nobody actually asks — "was that charge a one-off or a template?" — before
 * you could look anything up. They are now the Incoming group at the head of
 * the same register, under the same search, filters and sort: typing "netflix"
 * finds the subscription and every charge it has already made. The calendar
 * view plots both halves on the days they land.
 *
 * This is the only file that knows a recurring payment can be shown as a
 * history record; the register takes a plain view model and the module keeps
 * its own domain.
 */
export const HISTORY_VIEWS = ["list", "calendar"] as const;
export type HistoryViewMode = (typeof HISTORY_VIEWS)[number];

const VIEW_OPTIONS = [
  { value: "list", label: "List", icon: List },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

interface HistoryViewProps {
  expenses: Expense[];
  isLoading: boolean;
  view: HistoryViewMode;
  onViewChange: (view: HistoryViewMode) => void;
  /** Opens the add-expense dialog, seeded with a calendar day. */
  onAddExpense: (date: string) => void;
}

export function HistoryView({
  expenses,
  isLoading,
  view,
  onViewChange,
  onAddExpense,
}: HistoryViewProps) {
  const recurringQuery = useRecurringPayments();
  const recurringActions = useRecurringPaymentActions();

  const { openEdit } = recurringActions;
  const incoming = useMemo<IncomingRecord[]>(
    () =>
      (recurringQuery.data ?? []).map((payment) => ({
        id: payment.id,
        name: payment.provider_name,
        amount: payment.amount,
        category: payment.category,
        description: payment.description,
        date: payment.next_due_date,
        categorySuffix: `· ${FREQUENCY_LABELS[payment.frequency]}`,
        meta: `Next payment ${formatDate(payment.next_due_date)}`,
        metaTestId: "recurring-due-label",
        openLabel: `Edit recurring payment ${payment.provider_name}`,
        onOpen: () => openEdit(payment),
      })),
    [recurringQuery.data, openEdit],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Title and the view switch share one line — the switch belongs to the
          page, not to the content under it. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          History
        </h1>
        <SegmentedControl
          value={view}
          onChange={onViewChange}
          options={VIEW_OPTIONS}
          label="History view"
        />
      </div>

      {view === "list" ? (
        isLoading ? (
          <SkeletonList rows={5} />
        ) : (
          <ExpenseHistory
            expenses={expenses}
            incoming={incoming}
            incomingAction={
              <Button
                variant="ghost"
                size="sm"
                className="-my-1 h-7 px-2 text-xs"
                onClick={recurringActions.openCreate}
              >
                <Plus className="size-3.5" />
                New
              </Button>
            }
          />
        )
      ) : isLoading ? (
        <SkeletonList rows={4} />
      ) : (
        <HistoryCalendar
          expenses={expenses}
          recurringActions={recurringActions}
          onAddExpense={onAddExpense}
        />
      )}

      <RecurringPaymentDialogs actions={recurringActions} />
    </div>
  );
}
