"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/shared";
import { formatMonth } from "@/shared/format";
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
    <Card>
      <CardContent className="flex flex-wrap items-baseline justify-between gap-2">
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
        <Amount value={total} size="lg" />
      </CardContent>
    </Card>
  );
}
