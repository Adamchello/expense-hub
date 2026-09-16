"use client";

import { useMemo } from "react";
import { Button } from "@/libs/ui/button";
import { SegmentedControl } from "@/libs/ui/segmented-control";
import { SkeletonList } from "@/libs/ui/skeleton";
import type { IncomingRecord } from "@/shared/records/incoming-record";
import { useExpenses } from "@/modules/expense-management/core/store";
import { ExpenseHistory } from "@/modules/expense-management/presentation/expense-history";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import { useRecurringPaymentActions } from "@/modules/recurring-payments/core/use-recurring-payment-actions";
import { RecurringPaymentDialogs } from "@/modules/recurring-payments/presentation/recurring-payment-dialogs";
import { toIncomingRecord } from "../core/incoming-records";
import type { HistoryViewMode } from "../core/view-mode";
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
 */
const VIEW_OPTIONS = [
  { value: "list", label: "List", icon: List },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

interface HistoryProps {
  view: HistoryViewMode;
  onViewChange: (view: HistoryViewMode) => void;
}

export function History({ view, onViewChange }: HistoryProps) {
  const expensesQuery = useExpenses();
  const recurringQuery = useRecurringPayments();
  const recurringActions = useRecurringPaymentActions();

  const expenses = expensesQuery.data ?? [];
  const { openEdit } = recurringActions;
  const incoming = useMemo<IncomingRecord[]>(
    () =>
      (recurringQuery.data ?? []).map((payment) =>
        toIncomingRecord(payment, openEdit),
      ),
    [recurringQuery.data, openEdit],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* The view switch sits under the title — it belongs to the page, not
          to the content under it. */}
      <div className="flex flex-col items-start gap-3">
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

      {expensesQuery.isLoading ? (
        <SkeletonList rows={view === "list" ? 5 : 4} />
      ) : view === "list" ? (
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
      ) : (
        <HistoryCalendar
          expenses={expenses}
          recurringActions={recurringActions}
        />
      )}

      <RecurringPaymentDialogs actions={recurringActions} />
    </div>
  );
}
