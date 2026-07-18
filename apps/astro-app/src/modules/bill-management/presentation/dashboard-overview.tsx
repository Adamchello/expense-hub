"use client";

import { getCategoryColor } from "@/shared/configuration/category";
import { formatCurrency, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "../domain/bill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarRange,
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
  const recentBills = bills.slice(0, 5);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().toISOString().slice(0, 4);
  const thisMonthTotal = bills
    .filter((bill) => bill.date.startsWith(currentMonth))
    .reduce((sum, bill) => sum + bill.amount, 0);
  const thisYearTotal = bills
    .filter((bill) => bill.date.startsWith(currentYear))
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
      label: "This year",
      value: formatCurrency(thisYearTotal),
      sub: `in ${currentYear}`,
      icon: CalendarRange,
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

      {/* Recent Bills */}
      <Card>
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
                          getCategoryColor(bill.category),
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
    </div>
  );
}
