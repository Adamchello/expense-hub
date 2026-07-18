"use client";

import { CATEGORY_COLORS } from "@/shared/configuration/category";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "../domain/bill";
import type { Category } from "../domain/category";
import { useForecasts } from "@/modules/bill-forecasts/core/store";
import { useInsights } from "@/modules/bill-insights/core/store";
import {
  ICON_MAP,
  SENTIMENT_STYLES,
} from "@/modules/bill-insights/presentation/insight-icons";
import { BoldNumbers } from "@/modules/bill-insights/presentation/bold-numbers";
import type { Insight } from "@/modules/bill-insights/domain/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarClock,
  Receipt,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  bills: Bill[];
}

export function DashboardOverview({ bills }: DashboardOverviewProps) {
  const forecastQuery = useForecasts();
  const insightsQuery = useInsights();

  const recentBills = bills.slice(0, 3);
  const nextMonth = forecastQuery.data?.monthlyTotals[0];
  const topInsight = insightsQuery.data?.insights[0];

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = bills
    .filter((bill) => bill.date.startsWith(currentMonth))
    .reduce((sum, bill) => sum + bill.amount, 0);
  const categoriesUsed = new Set(bills.map((bill) => bill.category)).size;

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Bills tracked",
      value: String(bills.length),
      sub: bills.length === 0 ? "Add your first bill" : "all time",
      icon: Receipt,
    },
    {
      label: "This month",
      value: formatCurrency(thisMonthTotal),
      sub: "recorded so far",
      icon: Wallet,
    },
    {
      label: "Next month forecast",
      value: nextMonth ? formatCurrency(nextMonth.total) : "—",
      sub: nextMonth
        ? `${formatCurrency(nextMonth.confidence.low)} – ${formatCurrency(nextMonth.confidence.high)}`
        : "no data yet",
      icon: CalendarClock,
    },
    {
      label: "Categories",
      value: String(categoriesUsed),
      sub: "in use",
      icon: Tags,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-0 py-5">
            <CardContent className="px-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <stat.icon className="size-4.5" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Section A — Recent Bills */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">No bills yet</p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentBills.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Receipt className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {bill.provider_name}
                        </h4>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            CATEGORY_COLORS[bill.category],
                          )}
                        >
                          {bill.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(bill.date)}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                      {formatCurrency(bill.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Section B — Upcoming Month Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Month Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              {forecastQuery.isLoading ? (
                <p className="py-4 text-center text-muted-foreground">
                  Loading forecast...
                </p>
              ) : forecastQuery.error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    {forecastQuery.error instanceof Error
                      ? forecastQuery.error.message
                      : "Failed to load forecast"}
                  </p>
                </div>
              ) : !nextMonth ? (
                <p className="py-4 text-center text-muted-foreground">
                  No forecast data available yet
                </p>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {formatMonth(nextMonth.month)}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
                    {formatCurrency(nextMonth.total)}
                  </p>
                  <p className="mt-2 inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    {formatCurrency(nextMonth.confidence.low)} &ndash;{" "}
                    {formatCurrency(nextMonth.confidence.high)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section C — Top Insight */}
          <Card>
            <CardHeader>
              <CardTitle>Top Insight</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsQuery.isLoading ? (
                <p className="py-4 text-center text-muted-foreground">
                  Loading insights...
                </p>
              ) : insightsQuery.error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    {insightsQuery.error instanceof Error
                      ? insightsQuery.error.message
                      : "Failed to load insights"}
                  </p>
                </div>
              ) : !topInsight ? (
                <p className="py-4 text-center text-muted-foreground">
                  No insights available yet
                </p>
              ) : (
                <TopInsightCard insight={topInsight} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TopInsightCard({ insight }: { insight: Insight }) {
  const style = SENTIMENT_STYLES[insight.sentiment];
  const Icon = ICON_MAP[insight.iconHint];

  return (
    <div className={cn("rounded-lg border p-4", style.border, style.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconColor)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold">{insight.title}</h4>
            {insight.category && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  CATEGORY_COLORS[insight.category as Category],
                )}
              >
                {insight.category}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <BoldNumbers text={insight.description} />
          </p>
        </div>
      </div>
    </div>
  );
}
