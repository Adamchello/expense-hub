"use client";

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/libs/ui/card";
import { Amount } from "@/shared/money/amount";
import { EmptyState } from "@/libs/ui/empty-state";
import { SegmentedControl } from "@/libs/ui/segmented-control";
import { StatCard } from "@/shared/statistics/stat-card";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { cn } from "@/libs/ui/utils";
import { formatMonthShort } from "@/shared/format";
import { CategoryDonut, DonutLegend } from "./category-donut";
import { SpendingTrendChart, type TrendPoint } from "./spending-trend-chart";
import {
  averageMonthlySpending,
  categoryComparisons,
  monthlyTotals,
  monthsOfYearTo,
  previousMonthOf,
  spendingSummaries,
  totalsByCategory,
  yearlyTotals,
} from "../core/analytics";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";

interface SpendingAnalyticsProps {
  expenses: Expense[];
}

const DISTRIBUTION_SCOPES = [
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
] as const;

const TREND_SCOPES = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

/** At most this many slices before the tail folds into "Other". */
const MAX_SLICES = 8;

export function SpendingAnalytics({ expenses }: SpendingAnalyticsProps) {
  const [distributionScope, setDistributionScope] = useState<"month" | "all">(
    "month",
  );
  const [trendScope, setTrendScope] = useState<"month" | "year">("month");
  const { hexFor, textClassFor } = useCategoryOptions();

  if (expenses.length === 0) {
    return (
      <EmptyState description="No expenses recorded yet. Analytics appear once you start tracking expenses." />
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = currentMonth.slice(0, 4);
  const lastMonth = previousMonthOf(currentMonth);

  const months = monthlyTotals(expenses);
  const average = averageMonthlySpending(expenses);
  const thisMonthTotal =
    months.find((m) => m.month === currentMonth)?.total ?? 0;

  const distribution = totalsByCategory(
    expenses,
    distributionScope === "month" ? currentMonth : undefined,
  );
  const biggest = totalsByCategory(expenses, currentMonth)[0];
  const comparisons = categoryComparisons(expenses, currentMonth, lastMonth);
  const summaries = spendingSummaries(expenses, currentMonth);

  // Trend: months read as this calendar year so the axis is a continuous run
  // of months; years read as the whole history, which is what the toggle is
  // for once more than one year exists.
  const trendPoints: TrendPoint[] =
    trendScope === "month"
      ? monthsOfYearTo(expenses, currentMonth).map((entry) => ({
          key: entry.month,
          label: formatMonthShort(entry.month),
          total: entry.total,
        }))
      : yearlyTotals(expenses).map((entry) => ({
          key: entry.year,
          label: entry.year,
          total: entry.total,
        }));
  const hasTrend = trendPoints.some((point) => point.total > 0);

  // Donut: at most 8 slices, remainder folds into "Other".
  const distributionTotal = distribution.reduce((sum, e) => sum + e.total, 0);
  const topSlices = distribution.slice(0, MAX_SLICES).map((entry) => ({
    name: entry.category,
    value: entry.total,
    share: entry.share,
    hex: hexFor(entry.category),
  }));
  const restTotal = distribution
    .slice(MAX_SLICES)
    .reduce((sum, e) => sum + e.total, 0);
  const donutSlices =
    restTotal > 0
      ? [
          ...topSlices,
          {
            name: "Other",
            value: restTotal,
            share: Math.round((restTotal / distributionTotal) * 1000) / 10,
            // Deliberate neutral grey: "Other" is an aggregated remainder, not
            // a category, so it must never borrow a category's colour.
            hex: "#9ca3af",
          },
        ]
      : topSlices;

  const [headline, ...restSummaries] = summaries;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Headline stats. Two comparable money figures sit side by side; the
          month's biggest category is a name, not a sum, so it takes the tinted
          surface and the full width beneath them on a phone. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Average monthly spending"
          value={<Amount value={average} size="inherit" />}
          emphasis="primary"
          hint={`across ${months.length} ${months.length === 1 ? "month" : "months"} of history`}
        />

        <StatCard
          label="This month"
          value={<Amount value={thisMonthTotal} size="inherit" />}
          emphasis="primary"
          hint={
            average > 0 && thisMonthTotal > 0
              ? `${Math.round((thisMonthTotal / average) * 100)}% of your monthly average`
              : "recorded so far"
          }
        />

        <StatCard
          className="max-sm:col-span-2"
          tone="accent"
          label="Biggest category"
          value={biggest ? biggest.category : "—"}
          hint={
            biggest
              ? `${biggest.share}% of this month's spending`
              : "No expenses recorded this month yet."
          }
        />
      </div>

      {/* The two chart panels share a column template with the row below, so
          the seam runs straight down the page. */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Spending trend</CardTitle>
            <CardAction>
              <SegmentedControl
                value={trendScope}
                onChange={setTrendScope}
                options={TREND_SCOPES}
                label="Spending trend granularity"
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            {hasTrend ? (
              <SpendingTrendChart
                points={trendPoints}
                ariaLabel={
                  trendScope === "month"
                    ? `Monthly spending in ${currentYear}`
                    : "Spending by year"
                }
              />
            ) : (
              <EmptyState
                variant="inline"
                description={`No spending recorded in ${currentYear} yet.`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardAction>
              <SegmentedControl
                value={distributionScope}
                onChange={setDistributionScope}
                options={DISTRIBUTION_SCOPES}
                label="Spending distribution period"
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            {distribution.length === 0 ? (
              <EmptyState
                variant="inline"
                description="No expenses in this period."
              />
            ) : (
              <div className="flex flex-col items-center gap-5">
                <CategoryDonut slices={donutSlices} total={distributionTotal} />
                <DonutLegend slices={donutSlices} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_1fr]">
        {/* This month vs last month */}
        <Card>
          <CardHeader>
            <CardTitle>This month vs last month</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisons.length === 0 ? (
              <EmptyState
                variant="inline"
                description="Not enough data to compare months yet."
              />
            ) : (
              <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparisons.map((comparison) => (
                  <li
                    key={comparison.category}
                    className="flex min-w-0 flex-col gap-1"
                  >
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        textClassFor(comparison.category),
                      )}
                    >
                      {comparison.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Amount
                        value={comparison.previous}
                        size="sm"
                        weight="normal"
                        muted
                      />
                      <ArrowRight className="size-3 shrink-0" aria-hidden />
                      <Amount
                        value={comparison.current}
                        size="sm"
                        weight="normal"
                        muted
                      />
                    </span>
                    <ChangeChip
                      category={comparison.category}
                      changePct={comparison.changePct}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Insight. The month's dominant share gets stated as a figure as well
            as a sentence, because that number is the whole point of the card. */}
        <Card className="bg-accent ring-accent-foreground/15">
          <CardHeader>
            <CardTitle className="text-accent-foreground">Insight</CardTitle>
          </CardHeader>
          <CardContent>
            {!headline ? (
              <EmptyState
                variant="inline"
                description="Insights appear as more history accumulates."
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="max-w-[34ch] text-sm text-accent-foreground">
                    {headline}
                  </p>
                  {biggest && (
                    <p className="shrink-0 text-3xl font-semibold tabular-nums tracking-tight text-primary">
                      {biggest.share}%
                    </p>
                  )}
                </div>
                {restSummaries.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2 border-t border-accent-foreground/15 pt-3">
                    {restSummaries.map((summary) => (
                      <li
                        key={summary}
                        className="flex items-start gap-2 text-sm text-accent-foreground/90"
                      >
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-foreground/60"
                          aria-hidden="true"
                        />
                        {summary}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * The month-over-month move for one category.
 *
 * A record, not a verdict: the arrow states the direction and the colour stays
 * neutral, so spending more never reads as an error. The glyph is not the only
 * carrier — the direction is spelled out for screen readers, which a rotated
 * arrow and a colour both fail to reach.
 */
function ChangeChip({
  category,
  changePct,
}: {
  category: string;
  changePct: number | null;
}) {
  if (changePct === null) {
    return (
      <span className="inline-flex w-fit items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
        new
        <span className="sr-only"> category this month</span>
      </span>
    );
  }

  const isFlat = changePct === 0;
  const isDown = changePct < 0;
  const Icon = isFlat ? Minus : isDown ? ArrowDownRight : ArrowUpRight;
  const magnitude = `${Math.abs(changePct)}%`;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {isFlat ? "0%" : `${isDown ? "−" : "+"}${magnitude}`}
      <span className="sr-only">
        {isFlat
          ? `${category} unchanged versus last month`
          : `${category} ${isDown ? "down" : "up"} ${magnitude} versus last month`}
      </span>
    </span>
  );
}
