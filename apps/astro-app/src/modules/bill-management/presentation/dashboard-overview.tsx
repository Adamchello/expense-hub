"use client";

import { getCategoryColor } from "@/shared/configuration/category";
import { formatCurrency, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "../domain/bill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
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
  /** Navigates to the full Bill History tab. */
  onViewHistory?: () => void;
}

export function DashboardOverview({
  bills,
  onAddBill,
  onViewHistory,
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

  const recentBills = bills.slice(0, 3);

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bills</CardTitle>
          {bills.length > recentBills.length && (
            <button
              type="button"
              onClick={() => onViewHistory?.()}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all {bills.length}
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No bills yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <h4 className="truncate text-sm font-medium">
                    {bill.provider_name}
                  </h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        getCategoryColor(bill.category),
                      )}
                    >
                      {bill.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(bill.date)}
                    </span>
                  </div>
                  <p className="mt-2 text-right font-mono text-base font-semibold tracking-tight">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
