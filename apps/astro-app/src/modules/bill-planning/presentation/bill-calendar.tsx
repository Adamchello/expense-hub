"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonth } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { RecurringBill } from "@/modules/recurring-bills/domain/recurring-bill";
import {
  monthBounds,
  projectOccurrences,
  shiftMonth,
  type ProjectedOccurrence,
} from "../core/projection";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BillCalendarProps {
  recurringBills: RecurringBill[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BillCalendar({ recurringBills }: BillCalendarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));

  const occurrencesByDay = useMemo(() => {
    const { from, to } = monthBounds(month);
    const byDay = new Map<string, ProjectedOccurrence[]>();
    for (const occurrence of projectOccurrences(recurringBills, from, to)) {
      const list = byDay.get(occurrence.date) ?? [];
      list.push(occurrence);
      byDay.set(occurrence.date, list);
    }
    return byDay;
  }, [recurringBills, month]);

  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  // Monday-first column of the 1st.
  const leadingBlanks =
    (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recurring Bill Calendar</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth((prev) => shiftMonth(prev, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-32 text-center text-sm font-medium">
            {formatMonth(month)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth((prev) => shiftMonth(prev, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday) => (
            <p
              key={weekday}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {weekday}
            </p>
          ))}
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={`blank-${index}`} />;
            }
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const occurrences = occurrencesByDay.get(date) ?? [];
            const isToday = date === today;
            return (
              <div
                key={date}
                title={
                  occurrences.length > 0
                    ? occurrences
                        .map(
                          (occurrence) =>
                            `${occurrence.recurring.provider_name} — ${formatCurrency(occurrence.recurring.amount)}`,
                        )
                        .join("\n")
                    : undefined
                }
                className={cn(
                  "min-h-10 rounded-lg border p-1 sm:min-h-16 sm:p-1.5",
                  occurrences.length > 0
                    ? "border-border bg-accent/40"
                    : "border-transparent",
                  isToday && "ring-2 ring-primary",
                )}
              >
                <p
                  className={cn(
                    "text-xs",
                    isToday
                      ? "font-semibold text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {day}
                </p>
                {/* Compact dots on phones… */}
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {occurrences.slice(0, 3).map((occurrence) => (
                    <span
                      key={occurrence.recurring.id}
                      className="size-1.5 rounded-full bg-primary"
                      aria-label={occurrence.recurring.provider_name}
                    />
                  ))}
                  {occurrences.length > 3 && (
                    <span className="text-[9px] leading-none text-muted-foreground">
                      +{occurrences.length - 3}
                    </span>
                  )}
                </div>
                {/* …named chips on larger screens */}
                <div className="mt-0.5 hidden flex-col gap-0.5 sm:flex">
                  {occurrences.slice(0, 3).map((occurrence) => (
                    <p
                      key={occurrence.recurring.id}
                      title={`${occurrence.recurring.provider_name} — ${formatCurrency(occurrence.recurring.amount)}`}
                      className="truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] font-medium leading-tight text-foreground"
                    >
                      {occurrence.recurring.provider_name}
                    </p>
                  ))}
                  {occurrences.length > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{occurrences.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
