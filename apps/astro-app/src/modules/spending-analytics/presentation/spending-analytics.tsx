"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "@/modules/bill-management/domain/bill";
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
import {
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  ListChecks,
  Minus,
  Wallet,
} from "lucide-react";

interface SpendingAnalyticsProps {
  bills: Bill[];
}

const previousMonthOf = (month: string): string => {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7);
};

export function SpendingAnalytics({ bills }: SpendingAnalyticsProps) {
  const [distributionScope, setDistributionScope] = useState<"month" | "all">(
    "month",
  );
  const { badgeClassFor, hexFor } = useCategoryOptions();

  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No bills recorded yet. Analytics appear once you start tracking bills.
        </p>
      </div>
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = previousMonthOf(currentMonth);

  const months = monthlyTotals(bills);
  const average = averageMonthlySpending(bills);
  const thisMonthTotal =
    months.find((m) => m.month === currentMonth)?.total ?? 0;

  const distribution = totalsByCategory(
    bills,
    distributionScope === "month" ? currentMonth : undefined,
  );
  const biggest = totalsByCategory(bills, currentMonth)[0];
  const comparisons = categoryComparisons(bills, currentMonth, lastMonth);
  const summaries = spendingSummaries(bills, currentMonth);

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
            hex: "#9ca3af",
          },
        ]
      : topSlices;

  return (
    <div className="flex flex-col gap-6">
      {/* Headline stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-0 py-5">
          <CardContent className="px-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Wallet className="size-4.5" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Average monthly spending
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">
              {formatCurrency(average)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              across {months.length} {months.length === 1 ? "month" : "months"}{" "}
              of history
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="px-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ListChecks className="size-4.5" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              This month
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">
              {formatCurrency(thisMonthTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {average > 0 && thisMonthTotal > 0
                ? `${Math.round((thisMonthTotal / average) * 100)}% of your monthly average`
                : "recorded so far"}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="px-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Crown className="size-4.5" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Biggest category this month
            </p>
            {biggest ? (
              <>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {biggest.category}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {biggest.category} accounted for {biggest.share}% of your
                  spending this month.
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No bills recorded this month yet.
              </p>
            )}
          </CardContent>
        </Card>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Spending by Category</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={distributionScope === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDistributionScope("month")}
              >
                This month
              </Button>
              <Button
                variant={distributionScope === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDistributionScope("all")}
              >
                All time
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {distribution.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No bills in this period.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <CategoryDonut slices={donutSlices} total={distributionTotal} />
                <ul className="flex w-full flex-col gap-3">
                  {distribution.map((entry) => (
                    <li key={entry.category}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: hexFor(entry.category) }}
                            aria-hidden="true"
                          />
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              badgeClassFor(entry.category),
                            )}
                          >
                            {entry.category}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatCurrency(entry.total)} · {entry.share}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${entry.share}%`,
                            backgroundColor: hexFor(entry.category),
                          }}
                        />
                      </div>
                    </li>
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
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Not enough data to compare months yet.
                </p>
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
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            badgeClassFor(comparison.category),
                          )}
                        >
                          {comparison.category}
                        </span>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {formatCurrency(comparison.previous)} →{" "}
                          {formatCurrency(comparison.current)}
                        </span>
                        <span className="flex w-20 items-center justify-end gap-1 text-xs font-medium">
                          {direction === "up" && (
                            <>
                              <ArrowUpRight className="size-3.5 text-destructive" />
                              <span className="text-destructive">
                                +{comparison.changePct}%
                              </span>
                            </>
                          )}
                          {direction === "down" && (
                            <>
                              <ArrowDownRight className="size-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-green-600 dark:text-green-400">
                                {comparison.changePct}%
                              </span>
                            </>
                          )}
                          {direction === "flat" && (
                            <>
                              <Minus className="size-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">0%</span>
                            </>
                          )}
                          {direction === "new" && (
                            <span className="text-muted-foreground">new</span>
                          )}
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
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Summaries appear as more history accumulates.
                </p>
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
