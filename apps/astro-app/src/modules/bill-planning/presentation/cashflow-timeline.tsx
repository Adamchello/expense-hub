"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/shared/format";
import { daysUntil } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
import type { RecurringBill } from "@/modules/recurring-bills/domain/recurring-bill";
import { addDays, projectOccurrences } from "../core/projection";

interface CashflowTimelineProps {
  recurringBills: RecurringBill[];
}

const TIMELINE_DAYS = 30;

const relativeLabel = (days: number): string => {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

/** Chronological run of upcoming bills over the next 30 days. */
export function CashflowTimeline({ recurringBills }: CashflowTimelineProps) {
  const today = new Date().toISOString().slice(0, 10);
  const occurrences = projectOccurrences(
    recurringBills,
    today,
    addDays(today, TIMELINE_DAYS),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {occurrences.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing due in the next {TIMELINE_DAYS} days.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
            <li className="relative">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
              <p className="text-sm font-semibold text-primary">Today</p>
            </li>
            {occurrences.map((occurrence) => {
              const days = daysUntil(today, occurrence.date);
              return (
                <li
                  key={`${occurrence.recurring.id}-${occurrence.date}`}
                  className="relative"
                >
                  <span
                    className={cn(
                      "absolute -left-[20px] top-1.5 size-2 rounded-full ring-4 ring-background",
                      days <= 0 ? "bg-primary" : "bg-muted-foreground/40",
                    )}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <p className="text-sm font-medium">
                      {occurrence.recurring.provider_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(occurrence.date)} · {relativeLabel(days)}
                    </p>
                    <p className="ml-auto font-mono text-sm font-semibold tracking-tight">
                      {formatCurrency(occurrence.recurring.amount)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
