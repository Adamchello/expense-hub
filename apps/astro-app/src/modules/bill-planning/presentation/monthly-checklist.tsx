"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { RecurringBill } from "@/modules/recurring-bills/domain/recurring-bill";
import {
  useRecurringEvents,
  useLogRecurringBill,
  useSkipRecurringBill,
} from "@/modules/recurring-bills/core/store";
import { monthBounds } from "../core/projection";
import {
  buildMonthlyChecklist,
  type OccurrenceStatus,
} from "../core/checklist";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleSlash,
} from "lucide-react";

interface MonthlyChecklistProps {
  recurringBills: RecurringBill[];
}

const STATUS_META: Record<
  OccurrenceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
  },
  skipped: {
    label: "Skipped",
    icon: CircleSlash,
    className: "text-muted-foreground",
  },
  overdue: {
    label: "Overdue",
    icon: CircleAlert,
    className: "text-destructive",
  },
  upcoming: {
    label: "Upcoming",
    icon: CalendarClock,
    className: "text-muted-foreground",
  },
};

/** This month's bills as a check-off list: paid / skipped / overdue / upcoming. */
export function MonthlyChecklist({ recurringBills }: MonthlyChecklistProps) {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const { from, to } = monthBounds(month);

  const eventsQuery = useRecurringEvents(from, to);
  const logMutation = useLogRecurringBill();
  const skipMutation = useSkipRecurringBill();

  const items = buildMonthlyChecklist(
    recurringBills,
    eventsQuery.data ?? [],
    month,
    today,
  );

  const settledCount = items.filter(
    (item) => item.status === "paid" || item.status === "skipped",
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{formatMonth(month)} Checklist</CardTitle>
        {items.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {settledCount}/{items.length} settled
          </p>
        )}
      </CardHeader>
      <CardContent>
        {eventsQuery.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading checklist...
          </p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recurring bills fall due this month.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => {
              const meta = STATUS_META[item.status];
              const Icon = meta.icon;
              const isSettled =
                item.status === "paid" || item.status === "skipped";
              return (
                <li
                  key={item.key}
                  className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <Icon className={cn("size-4.5 shrink-0", meta.className)} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isSettled && "text-muted-foreground line-through",
                      )}
                    >
                      {item.provider}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <span
                    className={cn("w-20 text-xs font-medium", meta.className)}
                  >
                    {meta.label}
                  </span>
                  <p className="w-20 text-right font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(item.amount)}
                  </p>
                  {item.actionable && !isSettled && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          logMutation.isPending || skipMutation.isPending
                        }
                        onClick={() => logMutation.mutate(item.recurringId)}
                      >
                        Mark paid
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          logMutation.isPending || skipMutation.isPending
                        }
                        onClick={() => skipMutation.mutate(item.recurringId)}
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {(logMutation.error || skipMutation.error) && (
          <p className="mt-2 text-sm text-destructive">
            {(logMutation.error ?? skipMutation.error) instanceof Error
              ? ((logMutation.error ?? skipMutation.error) as Error).message
              : "Action failed"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
