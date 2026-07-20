"use client";

import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { formatCurrency, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Expense } from "../domain/expense";
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
  expenses: Expense[];
  /** Opens the add-expense dialog on the given tab (used by the empty state). */
  onAddExpense?: (tab: "single" | "import") => void;
  /** Navigates to the full Expense History tab. */
  onViewHistory?: () => void;
}

export function DashboardOverview({
  expenses,
  onAddExpense,
  onViewHistory,
}: DashboardOverviewProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Receipt className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Track your first expense</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Record expenses in seconds, or bring years of history over from your
          spreadsheet — totals, history and analytics build up from there.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => onAddExpense?.("single")}>
            <Plus className="size-4" />
            Add your first expense
          </Button>
          <Button variant="outline" onClick={() => onAddExpense?.("import")}>
            <FileSpreadsheet className="size-4" />
            Import from spreadsheet
          </Button>
        </div>
      </div>
    );
  }

  const { washClassFor, textClassFor } = useCategoryOptions();
  const recentExpenses = expenses.slice(0, 4);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().toISOString().slice(0, 4);
  const thisMonthTotal = expenses
    .filter((expense) => expense.date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const thisYearTotal = expenses
    .filter((expense) => expense.date.startsWith(currentYear))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const categoriesUsed = new Set(expenses.map((expense) => expense.category))
    .size;

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Expenses tracked",
      value: String(expenses.length),
      sub: expenses.length === 0 ? "Add your first expense" : "all time",
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

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Expenses</CardTitle>
          {expenses.length > recentExpenses.length && (
            <button
              type="button"
              onClick={() => onViewHistory?.()}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all {expenses.length}
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No expenses yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={cn(
                    "rounded-lg border p-3 transition-opacity hover:opacity-90",
                    washClassFor(expense.category),
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="min-w-0 truncate text-sm font-semibold">
                      {expense.provider_name}
                    </h4>
                    <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-semibold",
                      textClassFor(expense.category),
                    )}
                  >
                    {expense.category}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDate(expense.date)}
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
