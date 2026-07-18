"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/shared/format";
import { daysUntil } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
import { useRecurringBills, useLogRecurringBill } from "../core/store";
import { dueLabel } from "./recurring-bills";
import { BellRing } from "lucide-react";

const REMINDER_WINDOW_DAYS = 7;

/**
 * Dashboard reminders: recurring bills that are overdue, due today, or due
 * within the next week ("Rent due tomorrow", "Netflix renews today").
 */
export function UpcomingReminders() {
  const query = useRecurringBills();
  const logMutation = useLogRecurringBill();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (query.data ?? [])
    .filter(
      (bill) => daysUntil(today, bill.next_due_date) <= REMINDER_WINDOW_DAYS,
    )
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

  // Reminders stay quiet unless something is actually coming up.
  if (query.isLoading || query.error || upcoming.length === 0) return null;

  return (
    <Card data-e2e="upcoming-reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4.5 text-primary" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {upcoming.map((bill) => {
            const days = daysUntil(today, bill.next_due_date);
            const isDue = days <= 0;
            return (
              <li
                key={bill.id}
                className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{bill.provider_name}</span>{" "}
                  <span
                    className={cn(
                      isDue
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {dueLabel(bill.next_due_date, today)}
                  </span>
                </p>
                <p className="font-mono text-sm font-semibold tracking-tight">
                  {formatCurrency(bill.amount)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logMutation.isPending}
                  onClick={() => logMutation.mutate(bill.id)}
                >
                  Log bill
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
