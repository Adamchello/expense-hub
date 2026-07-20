"use client";

import { formatCurrency, formatMonth } from "@/shared/format";
import type { RecurringPayment } from "../domain/recurring-payment";
import {
  expectedTotal,
  monthBounds,
  projectOccurrences,
  shiftMonth,
} from "../core/projection";

interface NextMonthSummaryProps {
  recurringPayments: RecurringPayment[];
}

/**
 * Headline total for the next calendar month. True in both views, so it sits
 * above the view toggle rather than inside either one. The per-payment breakdown
 * lives in the grid and the calendar — no need to repeat it here.
 */
export function NextMonthSummary({ recurringPayments }: NextMonthSummaryProps) {
  const nextMonth = shiftMonth(new Date().toISOString().slice(0, 7), 1);
  const { from, to } = monthBounds(nextMonth);
  const occurrences = projectOccurrences(recurringPayments, from, to);
  const total = expectedTotal(occurrences);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          Expected in {formatMonth(nextMonth)}
        </p>
        <p className="text-xs text-muted-foreground">
          {occurrences.length === 0
            ? "Nothing scheduled"
            : `${occurrences.length} payment${occurrences.length === 1 ? "" : "s"} scheduled`}
        </p>
      </div>
      <p className="font-mono text-2xl font-semibold tracking-tight">
        {formatCurrency(total)}
      </p>
    </div>
  );
}
