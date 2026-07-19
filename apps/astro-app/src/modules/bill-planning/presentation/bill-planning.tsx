"use client";

import { SkeletonList } from "@/components/ui/skeleton";
import { useRecurringBills } from "@/modules/recurring-bills/core/store";
import { BillCalendar } from "./bill-calendar";
import { UpcomingMonth } from "./upcoming-month";

export function BillPlanning() {
  const query = useRecurringBills();

  if (query.isLoading) {
    return <SkeletonList rows={4} />;
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
          see the calendar and expected monthly totals.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BillCalendar recurringBills={recurringBills} />
      <UpcomingMonth recurringBills={recurringBills} />
    </div>
  );
}
