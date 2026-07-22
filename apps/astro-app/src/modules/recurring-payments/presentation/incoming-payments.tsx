"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataList, EmptyState, ListRow, ListTotal } from "@/components/shared";
import { formatDate } from "@/shared/format";
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
          Upcoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {occurrences.length === 0 ? (
          <EmptyState
            variant="inline"
            description={`No recurring payments in the next ${WINDOW_DAYS} days.`}
          />
        ) : (
          <>
            <DataList>
              {shown.map((occurrence) => (
                <ListRow
                  key={`${occurrence.recurring.id}-${occurrence.date}`}
                  name={occurrence.recurring.provider_name}
                  meta={`${formatDate(occurrence.date)} · ${whenLabel(
                    daysUntil(today, occurrence.date),
                  )}`}
                  amount={occurrence.recurring.amount}
                />
              ))}
            </DataList>
            <ListTotal
              label={
                <>
                  Next {WINDOW_DAYS} days
                  {occurrences.length > shown.length &&
                    ` · ${occurrences.length - shown.length} more`}
                </>
              }
              value={total}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
