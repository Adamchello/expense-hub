"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonth } from "@/shared/format";
import {
  daysInMonth,
  leadingBlanks,
  shiftMonth,
} from "@/shared/domain/calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One thing sitting on one day.
 *
 * `tone` is the whole point of this type: a calendar that draws money already
 * spent and money merely scheduled in the same ink is lying about the
 * difference between a fact and a forecast. Colour carries the category, fill
 * carries the tense — solid for logged, hollow for scheduled.
 */
export interface CalendarEntry {
  /** Unique within its day. */
  id: string;
  label: string;
  amount: number;
  tone: "logged" | "scheduled";
  /** Dot colour as a hex string — the category's own colour. */
  color?: string;
}

interface MonthCalendarProps {
  /** YYYY-MM. */
  month: string;
  onMonthChange: (month: string) => void;
  entriesByDay: Map<string, CalendarEntry[]>;
  /** Currently opened day (YYYY-MM-DD), highlighted in the grid. */
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  /** YYYY-MM-DD — the day that gets the "today" ring. */
  today: string;
  /** Headline figure beside the month name, e.g. the month's spend. */
  total?: number;
  /** Sits under the grid — legend, notes, whatever the caller is counting. */
  footer?: React.ReactNode;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Dots that fit under a day number before they start to crowd it. */
const MAX_DOTS = 4;

/**
 * A month grid that knows nothing about what it is plotting. Callers hand it
 * entries per day and get back the day that was clicked; expenses, recurring
 * payments and anything else that happens on a date render through the same
 * cell.
 *
 * The cells carry no borders and no fills of their own — a 7×6 lattice of
 * boxes is a spreadsheet, and the thing worth seeing here is the rhythm of the
 * dots. Weeks are separated by a hairline, and only the selected day and today
 * get any chrome at all.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  entriesByDay,
  selectedDate,
  onSelectDay,
  today,
  total,
  footer,
}: MonthCalendarProps) {
  const blanks = leadingBlanks(month);
  const dayCount = daysInMonth(month);
  const cells: (number | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
    // Pad the last week so its hairline runs the full width.
    ...Array.from({ length: (7 - ((blanks + dayCount) % 7)) % 7 }, () => null),
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <CardTitle>{formatMonth(month)}</CardTitle>
          {total !== undefined && (
            <span className="text-sm font-medium text-primary">
              Total: {formatCurrency(total)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <span
              key={weekday}
              className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {weekday}
            </span>
          ))}
          {cells.map((day, index) => {
            // Every cell in a week shares the rule above it, blanks included.
            const weekRule = index >= 7 ? "border-t border-border/60" : "";
            if (day === null) {
              return <div key={`blank-${index}`} className={weekRule} />;
            }
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const entries = entriesByDay.get(date) ?? [];
            const isToday = date === today;
            const isSelected = date === selectedDate;
            return (
              <div key={date} className={cn("p-1", weekRule)}>
                <button
                  type="button"
                  onClick={() => onSelectDay(date)}
                  aria-pressed={isSelected}
                  aria-label={
                    entries.length > 0
                      ? `${entries.length} item${entries.length === 1 ? "" : "s"} on ${date}`
                      : `Nothing on ${date}`
                  }
                  title={
                    entries.length > 0
                      ? entries
                          .map(
                            (entry) =>
                              `${entry.label} — ${formatCurrency(entry.amount)}`,
                          )
                          .join("\n")
                      : undefined
                  }
                  className={cn(
                    "flex min-h-14 w-full flex-col items-center justify-start gap-1.5 rounded-xl border border-transparent px-1 pb-1.5 pt-2 transition-colors",
                    "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isSelected &&
                      "border-primary bg-primary/5 hover:bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-sm tabular-nums",
                      isToday
                        ? "bg-primary font-semibold text-primary-foreground"
                        : isSelected
                          ? "font-semibold text-primary"
                          : "text-foreground",
                    )}
                  >
                    {day}
                  </span>
                  <span className="flex min-h-2 flex-wrap items-center justify-center gap-1">
                    {entries.slice(0, MAX_DOTS).map((entry) => (
                      <span
                        key={entry.id}
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        // Hollow = not spent yet: same colour, drawn as an
                        // outline rather than a second hue nobody can decode.
                        style={
                          entry.tone === "scheduled"
                            ? {
                                boxShadow: `inset 0 0 0 1.5px ${entry.color ?? "currentColor"}`,
                              }
                            : { backgroundColor: entry.color ?? "currentColor" }
                        }
                      />
                    ))}
                    {entries.length > MAX_DOTS && (
                      <span className="text-[10px] leading-none text-muted-foreground">
                        +{entries.length - MAX_DOTS}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}

/** The two fills, named. Without this the grid is a shape quiz. */
export function CalendarLegend({
  loggedLabel,
  scheduledLabel,
}: {
  loggedLabel: string;
  scheduledLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className="size-2 rounded-full bg-muted-foreground"
          aria-hidden="true"
        />
        {loggedLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="size-2 rounded-full ring-1 ring-inset ring-muted-foreground"
          aria-hidden="true"
        />
        {scheduledLabel}
      </span>
    </div>
  );
}
