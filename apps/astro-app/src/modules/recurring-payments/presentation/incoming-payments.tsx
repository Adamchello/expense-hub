"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/shared/format";
import { daysUntil } from "@/shared/domain/recurrence";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import { addDays, expectedTotal, projectOccurrences } from "../core/projection";
import { CalendarClock } from "lucide-react";

const WINDOW_DAYS = 30;
const MAX_ROWS = 5;

const whenLabel = (days: number): string => {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

/** Next recurring charges — informational only, they post automatically. */
export function IncomingPayments() {
  const query = useRecurringPayments();

  const today = new Date().toISOString().slice(0, 10);
  const occurrences = projectOccurrences(
    query.data ?? [],
    today,
    addDays(today, WINDOW_DAYS),
  );
  const shown = occurrences.slice(0, MAX_ROWS);
  const total = expectedTotal(occurrences);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4.5 text-primary" />
          Incoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {occurrences.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recurring payments in the next {WINDOW_DAYS} days.
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {shown.map((occurrence) => (
                <li
                  key={`${occurrence.recurring.id}-${occurrence.date}`}
                  className="flex items-baseline gap-2 py-2 first:pt-0"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {occurrence.recurring.provider_name}
                  </p>
                  <p className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDate(occurrence.date)} ·{" "}
                    {whenLabel(daysUntil(today, occurrence.date))}
                  </p>
                  <p className="w-20 shrink-0 text-right font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(occurrence.recurring.amount)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">
                Next {WINDOW_DAYS} days
                {occurrences.length > shown.length &&
                  ` · ${occurrences.length - shown.length} more`}
              </p>
              <p className="font-mono text-sm font-semibold tracking-tight">
                {formatCurrency(total)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
