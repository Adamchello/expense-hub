"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Amount,
  Callout,
  CardTable,
  CardTableCell,
  CardTableRow,
  CARD_TABLE_GRID,
  CategoryBadge,
  EmptyState,
  ListTotal,
  errorMessage,
  type CardTableColumn,
} from "@/components/shared";
import { SkeletonPanel } from "@/components/ui/skeleton";
import { formatDate } from "@/shared/format";
import { daysUntil } from "@/shared/domain/recurrence";
import { useRecurringPayments } from "@/modules/recurring-payments/core/store";
import { addDays, expectedTotal, projectOccurrences } from "../core/projection";
import { ArrowRight } from "lucide-react";

const WINDOW_DAYS = 30;
const MAX_ROWS = 5;

const whenLabel = (days: number): string => {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

// Shares `CARD_TABLE_GRID` with the recent-expenses register so the two cards
// sitting side by side read as one system rather than two near-misses.
//
// "Due in" replaces the absolute date entirely. The two were competing for the
// same column of attention, and the relative distance is the actionable half —
// "in 3 days" is what changes a decision; "Jul 27, 2026" is bookkeeping.
const COLUMNS: CardTableColumn[] = [
  { label: "Payee" },
  { label: "Category" },
  { label: "Due in" },
  { label: "Amount", className: "text-right" },
];

/** Next recurring charges — informational only, they post automatically. */
interface IncomingPaymentsProps {
  /** Opens History, where these charges sit on the calendar. */
  onViewAll?: () => void;
}

export function IncomingPayments({ onViewAll }: IncomingPaymentsProps) {
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
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Upcoming payments</CardTitle>
        {onViewAll && (
          <CardAction>
            <button
              type="button"
              onClick={onViewAll}
              aria-label="View all upcoming payments on the calendar"
              className="-my-3 flex items-center gap-1 rounded-md py-3 text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {/* "Nothing due" and "I could not find out" are different sentences,
            and this card used to say the first when it meant the second: it
            read `query.data ?? []` and never checked the query's state, so a
            failed request rendered as a confident all-clear. On the one card
            that answers "what is about to leave my account", that is the worst
            available failure — a missed rent charge presented as good news. */}
        {query.isLoading ? (
          <SkeletonPanel rows={MAX_ROWS} />
        ) : query.error ? (
          <Callout variant="error">
            {errorMessage(query.error, "Couldn't load upcoming payments")}
          </Callout>
        ) : occurrences.length === 0 ? (
          <EmptyState
            variant="inline"
            description={`No recurring payments in the next ${WINDOW_DAYS} days.`}
          />
        ) : (
          <>
            <CardTable
              label="Upcoming payments"
              gridClassName={CARD_TABLE_GRID}
              columns={COLUMNS}
            >
              {shown.map((occurrence) => {
                const days = daysUntil(today, occurrence.date);
                return (
                  <CardTableRow
                    key={`${occurrence.recurring.id}-${occurrence.date}`}
                  >
                    <CardTableCell className="truncate text-sm font-medium text-foreground">
                      {occurrence.recurring.provider_name}
                    </CardTableCell>

                    {/* Below sm the chip and the countdown drop to a second
                        line and the amount rides up beside the payee. */}
                    <CardTableCell className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                      <CategoryBadge category={occurrence.recurring.category} />
                    </CardTableCell>

                    <CardTableCell
                      className="col-start-2 row-start-2 justify-self-end text-xs font-medium text-primary sm:col-start-3 sm:row-start-1 sm:justify-self-start"
                      // The countdown is relative, so the date it resolves to
                      // stays reachable rather than being thrown away.
                      title={formatDate(occurrence.date)}
                    >
                      {whenLabel(days)}
                    </CardTableCell>

                    <CardTableCell className="col-start-2 row-start-1 text-right sm:col-start-4">
                      <Amount value={occurrence.recurring.amount} size="md" />
                    </CardTableCell>
                  </CardTableRow>
                );
              })}
            </CardTable>
            <ListTotal
              label={
                <>
                  Total upcoming
                  {occurrences.length > shown.length &&
                    ` · ${occurrences.length - shown.length} more`}
                </>
              }
              value={total}
              emphasis
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
