"use client";

import type { Expense } from "../domain/expense";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Amount,
  CardTable,
  CardTableCell,
  CardTableRow,
  CARD_TABLE_GRID,
  CategoryBadge,
  EmptyState,
  type CardTableColumn,
} from "@/components/shared";
import { formatDate } from "@/shared/format";
import { ArrowRight } from "lucide-react";

const MAX_ROWS = 5;

/**
 * The last handful of expenses, as a scannable register.
 *
 * Replaces a grid of tinted cards: five records in five boxes made the eye
 * hunt for the amount in a different place each time. Fixed columns let
 * amounts and dates line up, which is the whole reason to look at a recent
 * list — you are comparing, not reading.
 *
 * The row is one line from `sm` up and folds to two lines below it. Squeezing
 * payee, amount, category and date onto a 360px line costs either truncation
 * or 10px type; a second line costs nothing.
 */
interface RecentExpensesCardProps {
  expenses: Expense[];
  /** Navigates to the full history view. */
  onViewAll?: () => void;
}

// Money last and right-aligned, everything before it left-aligned: the amount
// is the only column you read as a quantity, and a column of quantities has to
// share a right edge to be comparable at a glance.
const COLUMNS: CardTableColumn[] = [
  { label: "Payee" },
  { label: "Category" },
  { label: "Date" },
  { label: "Amount", className: "text-right" },
];

export function RecentExpensesCard({
  expenses,
  onViewAll,
}: RecentExpensesCardProps) {
  const recent = expenses.slice(0, MAX_ROWS);
  const hasMore = expenses.length > recent.length;

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Recent expenses</CardTitle>
        {onViewAll && (
          <CardAction>
            {/* The visible label is short because the card title sits beside
                it; the accessible name is not, because a button rotor lists
                names with no card around them — and there were two buttons
                reading exactly "View all" on this page. The `py`/`-my` pair
                buys a 44px hit area without moving the text. */}
            <button
              type="button"
              onClick={onViewAll}
              aria-label="View all expenses"
              className="-my-3 flex items-center gap-1 rounded-md py-3 text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {recent.length === 0 ? (
          <EmptyState
            variant="inline"
            description="No expenses recorded in this period."
          />
        ) : (
          <CardTable
            label="Recent expenses"
            gridClassName={CARD_TABLE_GRID}
            columns={COLUMNS}
          >
            {recent.map((expense) => (
              <CardTableRow key={expense.id}>
                <CardTableCell className="truncate text-sm font-medium text-foreground">
                  {expense.provider_name}
                </CardTableCell>

                {/* Below sm the chip and the date drop to a second line and
                    the amount rides up beside the payee: the figure you are
                    scanning for is never the thing that wraps. */}
                <CardTableCell className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                  <CategoryBadge category={expense.category} />
                </CardTableCell>

                <CardTableCell className="col-start-2 row-start-2 justify-self-end text-xs text-muted-foreground sm:col-start-3 sm:row-start-1 sm:justify-self-start">
                  {formatDate(expense.date)}
                </CardTableCell>

                <CardTableCell className="col-start-2 row-start-1 text-right sm:col-start-4">
                  <Amount value={expense.amount} size="md" />
                </CardTableCell>
              </CardTableRow>
            ))}
          </CardTable>
        )}
      </CardContent>

      {hasMore && onViewAll && (
        <CardFooter className="pt-1">
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-11 w-full rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all {expenses.length} expenses
          </button>
        </CardFooter>
      )}
    </Card>
  );
}
