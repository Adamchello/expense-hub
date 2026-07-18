"use client";

import { useRecurringBills } from "@/modules/recurring-bills/core/store";
import { BillCalendar } from "./bill-calendar";
import { CashflowTimeline } from "./cashflow-timeline";
import { MonthlyChecklist } from "./monthly-checklist";
import { UpcomingMonth } from "./upcoming-month";

export function BillPlanning() {
  const query = useRecurringBills();

  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading planning view...</p>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
        <p className="text-sm text-destructive">
          {query.error instanceof Error
            ? query.error.message
            : "Failed to load recurring bills"}
        </p>
      </div>
    );
  }

  const recurringBills = query.data ?? [];

  if (recurringBills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Planning is built from your recurring bills. Add recurring bills to
          see the calendar, expected totals, and cash flow timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MonthlyChecklist recurringBills={recurringBills} />
      <BillCalendar recurringBills={recurringBills} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <UpcomingMonth recurringBills={recurringBills} />
        <CashflowTimeline recurringBills={recurringBills} />
      </div>
    </div>
  );
}
