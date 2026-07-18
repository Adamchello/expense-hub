"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryColor } from "@/shared/configuration/category";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { RecurringBill } from "@/modules/recurring-bills/domain/recurring-bill";
import {
  expectedTotal,
  monthBounds,
  projectOccurrences,
  shiftMonth,
} from "../core/projection";

interface UpcomingMonthProps {
  recurringBills: RecurringBill[];
}

/**
 * Expected bills for the next calendar month, straight from recurring
 * schedules — no prediction involved.
 */
export function UpcomingMonth({ recurringBills }: UpcomingMonthProps) {
  const nextMonth = shiftMonth(new Date().toISOString().slice(0, 7), 1);
  const { from, to } = monthBounds(nextMonth);
  const occurrences = projectOccurrences(recurringBills, from, to);
  const total = expectedTotal(occurrences);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected in {formatMonth(nextMonth)}</CardTitle>
      </CardHeader>
      <CardContent>
        {occurrences.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recurring bills scheduled for {formatMonth(nextMonth)}.
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {occurrences.map((occurrence) => (
                <li
                  key={`${occurrence.recurring.id}-${occurrence.date}`}
                  className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {occurrence.recurring.provider_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(occurrence.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      getCategoryColor(occurrence.recurring.category),
                    )}
                  >
                    {occurrence.recurring.category}
                  </span>
                  <p className="w-20 text-right font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(occurrence.recurring.amount)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <p className="text-sm font-medium text-muted-foreground">
                Expected total
              </p>
              <p className="font-mono text-lg font-semibold tracking-tight">
                {formatCurrency(total)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
