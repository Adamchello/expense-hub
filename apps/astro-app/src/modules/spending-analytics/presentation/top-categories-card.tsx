"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/libs/ui/card";
import {
  Amount,
  EmptyState,
  ShareBar,
  Sparkline,
  TrendDelta,
} from "@/components/shared";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { formatMonth } from "@/shared/format";
import {
  changePct,
  previousMonthOf,
  spendingPace,
  totalsByCategory,
} from "../core/analytics";
import { ArrowRight } from "lucide-react";

const TOP_N = 4;

/**
 * Where the month's money actually went — the three largest categories, each
 * as its own tile.
 *
 * This was a stack of three bars in a list. A bar answers "how big a slice",
 * which is one question; a category you are trying to act on raises three —
 * how much, what share, and whether it is growing. Each tile now answers all
 * three in one glance, and the sparkline gives the shape the bar cannot.
 */
interface TopCategoriesCardProps {
  expenses: Expense[];
  /** The month being reported, YYYY-MM. */
  month: string;
  /** Navigates to the full analytics view. */
  onViewReport?: () => void;
}

export function TopCategoriesCard({
  expenses,
  month,
  onViewReport,
}: TopCategoriesCardProps) {
  const { hexFor } = useCategoryOptions();
  const previousMonth = previousMonthOf(month);
  const top = totalsByCategory(expenses, month).slice(0, TOP_N);
  const previousTotals = new Map(
    totalsByCategory(expenses, previousMonth).map((entry) => [
      entry.category,
      entry.total,
    ]),
  );

  return (
    <Card>
      {/* Below sm the title and the link stop sharing a row: "Top categories
          this month" beside "View full report" wraps the title into two lines
          and butts it against the link at 360px. */}
      <CardHeader className="max-sm:grid-cols-1!">
        <CardTitle>Top categories · {formatMonth(month)}</CardTitle>
        {onViewReport && (
          <CardAction className="max-sm:col-start-1! max-sm:row-start-2! max-sm:justify-self-start">
            <button
              type="button"
              onClick={onViewReport}
              className="-my-3 flex items-center gap-1 rounded-md py-3 text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View full report
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyState
            variant="inline"
            description="No spending recorded in this period yet."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* Four across only from xl: at lg the sidebar leaves the card too
                narrow for four tiles that each carry a figure and a bar. */}
            {top.map((entry) => {
              const color = hexFor(entry.category);
              const pace = spendingPace(expenses, month, {
                category: entry.category,
              });

              return (
                <li
                  key={entry.category}
                  className="flex flex-col rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.category}
                      </p>
                      <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
                        <Amount value={entry.total} size="inherit" />
                      </p>
                    </div>

                    {/* Hugs the top-right so the tile's reading order stays
                        name → amount → detail; the line is the last thing
                        looked at, not the first. */}
                    <Sparkline
                      values={pace}
                      color={color}
                      label={entry.category}
                      className="mt-1 w-16 shrink-0 sm:w-20"
                    />
                  </div>

                  {/* The share is stated once, on the bar that draws it. It
                      used to be spelled out here as well — the same number
                      twice in one tile, four inches apart. */}
                  {/* `emptyLabel` matters most on the biggest tile: a category
                      with no prior month has no delta, so Rent — often the
                      largest share on the card — was the emptiest box on it. */}
                  <TrendDelta
                    className="mt-2"
                    changePct={changePct(
                      entry.total,
                      previousTotals.get(entry.category) ?? 0,
                    )}
                    comparisonLabel={formatMonth(previousMonth)}
                    emptyLabel={`Nothing recorded in ${formatMonth(previousMonth)}`}
                  />

                  <div className="mt-auto flex items-center gap-3 pt-3">
                    <ShareBar
                      share={entry.share}
                      color={color}
                      label={entry.category}
                      className="flex-1"
                    />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {entry.share}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
