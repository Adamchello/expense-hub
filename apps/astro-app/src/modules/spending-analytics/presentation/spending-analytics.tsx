"use client";

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Amount,
  CategoryBadge,
  CategoryShareRow,
  EmptyState,
  SegmentedControl,
  StatCard,
} from "@/components/shared";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { CategoryDonut } from "./category-donut";
import {
  averageMonthlySpending,
  categoryComparisons,
  monthlyTotals,
  spendingSummaries,
  totalsByCategory,
} from "../core/analytics";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface SpendingAnalyticsProps {
  expenses: Expense[];
}

const DISTRIBUTION_SCOPES = [
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
] as const;

const previousMonthOf = (month: string): string => {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7);
};

export function SpendingAnalytics({ expenses }: SpendingAnalyticsProps) {
  const [distributionScope, setDistributionScope] = useState<"month" | "all">(
    "month",
  );
  const { hexFor } = useCategoryOptions();

  if (expenses.length === 0) {
    return (
      <EmptyState description="No expenses recorded yet. Analytics appear once you start tracking expenses." />
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
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

  // Donut: at most 8 slices, remainder folds into "Other".
  const distributionTotal = distribution.reduce((sum, e) => sum + e.total, 0);
  const topSlices = distribution.slice(0, 8).map((entry) => ({
    name: entry.category,
    value: entry.total,
    share: entry.share,
    hex: hexFor(entry.category),
  }));
  const restTotal = distribution.slice(8).reduce((sum, e) => sum + e.total, 0);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Average monthly spending"
          value={<Amount value={average} size="inherit" />}
          hint={`across ${months.length} ${months.length === 1 ? "month" : "months"} of history`}
        />

        <StatCard
          label="This month"
          value={<Amount value={thisMonthTotal} size="inherit" />}
          hint={
            average > 0 && thisMonthTotal > 0
              ? `${Math.round((thisMonthTotal / average) * 100)}% of your monthly average`
              : "recorded so far"
          }
        />

        <StatCard
          label="Biggest category this month"
          value={biggest ? biggest.category : "—"}
          hint={
            biggest
              ? `${biggest.share}% of this month's spending`
              : "No expenses recorded this month yet."
          }
        />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart months={months} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Spending by category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
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
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <CategoryDonut slices={donutSlices} total={distributionTotal} />
                <ul className="flex w-full flex-col gap-3">
                  {distribution.map((entry) => (
                    <CategoryShareRow
                      key={entry.category}
                      category={entry.category}
                      total={entry.total}
                      share={entry.share}
                    />
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* This month vs last month */}
          <Card>
            <CardHeader>
              <CardTitle>This Month vs Last Month</CardTitle>
            </CardHeader>
            <CardContent>
              {comparisons.length === 0 ? (
                <EmptyState
                  variant="inline"
                  description="Not enough data to compare months yet."
                />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {comparisons.map((comparison) => {
                    const direction =
                      comparison.changePct === null
                        ? "new"
                        : comparison.changePct > 0
                          ? "up"
                          : comparison.changePct < 0
                            ? "down"
                            : "flat";
                    return (
                      <li
                        key={comparison.category}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <CategoryBadge category={comparison.category} />
                        <span className="ml-auto text-xs text-muted-foreground">
                          <Amount
                            value={comparison.previous}
                            size="sm"
                            weight="normal"
                            muted
                          />{" "}
                          →{" "}
                          <Amount
                            value={comparison.current}
                            size="sm"
                            weight="normal"
                            muted
                          />
                        </span>
                        {/* A record, not a verdict: the arrow states the fact
                            (up/down); the color stays neutral so spending more
                            never reads as an error. */}
                        <span className="flex w-20 items-center justify-end gap-1 text-xs font-medium text-muted-foreground">
                          {direction === "up" && (
                            <>
                              <ArrowUpRight className="size-3.5" />
                              <span>+{comparison.changePct}%</span>
                            </>
                          )}
                          {direction === "down" && (
                            <>
                              <ArrowDownRight className="size-3.5" />
                              <span>{comparison.changePct}%</span>
                            </>
                          )}
                          {direction === "flat" && (
                            <>
                              <Minus className="size-3.5" />
                              <span>0%</span>
                            </>
                          )}
                          {direction === "new" && <span>new</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Summaries */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              {summaries.length === 0 ? (
                <EmptyState
                  variant="inline"
                  description="Summaries appear as more history accumulates."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {summaries.map((summary) => (
                    <li
                      key={summary}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {summary}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
