"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonth } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { RecurringPayment } from "../domain/recurring-payment";
import {
  monthBounds,
  projectOccurrences,
  shiftMonth,
  type ProjectedOccurrence,
} from "../core/projection";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  /** A day that already has something due — opens its detail. */
  onSelectDay: (date: string) => void;
  /** A day with nothing on it — starts a new payment due that day. */
  onAddOnDay: (date: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Chips that fit a full-width cell; the rest are one click away. */
const MAX_CHIPS = 4;

export function PaymentCalendar({
  recurringPayments,
  onSelectDay,
  onAddOnDay,
}: PaymentCalendarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));

  const occurrencesByDay = useMemo(() => {
    const { from, to } = monthBounds(month);
    const byDay = new Map<string, ProjectedOccurrence[]>();
    for (const occurrence of projectOccurrences(recurringPayments, from, to)) {
      const list = byDay.get(occurrence.date) ?? [];
      list.push(occurrence);
      byDay.set(occurrence.date, list);
    }
    return byDay;
  }, [recurringPayments, month]);

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
        <CardTitle>Payment Calendar</CardTitle>
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
            const hasPayments = occurrences.length > 0;
            const activate = () =>
              hasPayments ? onSelectDay(date) : onAddOnDay(date);
            return (
              <div
                key={date}
                role="button"
                tabIndex={0}
                aria-label={
                  hasPayments
                    ? `${occurrences.length} payment${occurrences.length === 1 ? "" : "s"} on ${date}`
                    : `Add a recurring payment due ${date}`
                }
                onClick={activate}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activate();
                  }
                }}
                className={cn(
                  "group/day min-h-14 cursor-pointer rounded-lg border p-1 transition-colors sm:min-h-24 sm:p-1.5",
                  hasPayments
                    ? "border-border bg-accent/40 hover:border-primary/50 hover:bg-accent"
                    : "border-transparent hover:border-dashed hover:border-border hover:bg-accent/20",
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
                {!hasPayments && (
                  <Plus
                    aria-hidden="true"
                    className="mx-auto hidden size-4 text-muted-foreground opacity-0 transition-opacity group-hover/day:opacity-100 sm:mt-2 sm:block"
                  />
                )}
                {/* Compact dots on phones… */}
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {occurrences.slice(0, MAX_CHIPS).map((occurrence) => (
                    <span
                      key={occurrence.recurring.id}
                      className="size-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  ))}
                  {occurrences.length > MAX_CHIPS && (
                    <span className="text-[9px] leading-none text-muted-foreground">
                      +{occurrences.length - MAX_CHIPS}
                    </span>
                  )}
                </div>
                {/* …named chips on larger screens */}
                <div className="mt-0.5 hidden flex-col gap-0.5 sm:flex">
                  {occurrences.slice(0, MAX_CHIPS).map((occurrence) => (
                    <p
                      key={occurrence.recurring.id}
                      title={`${occurrence.recurring.provider_name} — ${formatCurrency(occurrence.recurring.amount)}`}
                      className="truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] font-medium leading-tight text-foreground"
                    >
                      {occurrence.recurring.provider_name}
                    </p>
                  ))}
                  {occurrences.length > MAX_CHIPS && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{occurrences.length - MAX_CHIPS} more
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
