"use client";

import { getCategoryColor } from "@/shared/configuration/category";
import { formatCurrency, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "../domain/bill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarRange,
  FileSpreadsheet,
  Plus,
  Receipt,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  bills: Bill[];
  /** Opens the add-bill dialog on the given tab (used by the empty state). */
  onAddBill?: (tab: "single" | "import") => void;
}

export function DashboardOverview({
  bills,
  onAddBill,
}: DashboardOverviewProps) {
  if (bills.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Receipt className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Track your first bill</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Record bills in seconds, or bring years of history over from your
          spreadsheet — totals, history and analytics build up from there.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => onAddBill?.("single")}>
            <Plus className="size-4" />
            Add your first bill
          </Button>
          <Button variant="outline" onClick={() => onAddBill?.("import")}>
            <FileSpreadsheet className="size-4" />
            Import from spreadsheet
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-0 py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">
                <stat.icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
                <p className="mt-0.5 truncate font-mono text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {stat.sub}
                </p>
              </div>
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
