"use client";

import type { ReactNode } from "react";
import { formatDate } from "@/shared/format";
import type { Expense } from "../domain/expense";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Amount, EmptyState, RecordCard, StatCard } from "@/components/shared";
import { ArrowRight, FileSpreadsheet, Plus, Receipt } from "lucide-react";

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
      <EmptyState
        icon={Receipt}
        title="Track your first expense"
        description="Record expenses in seconds, or bring years of history over from your spreadsheet — totals, history and analytics build up from there."
        actions={
          <>
            <Button onClick={() => onAddExpense?.("single")}>
              <Plus className="size-4" />
              Add your first expense
            </Button>
            <Button variant="outline" onClick={() => onAddExpense?.("import")}>
              <FileSpreadsheet className="size-4" />
              Import from spreadsheet
            </Button>
          </>
        }
      />
    );
  }

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

  // Money renders as <Amount>; counts stay in the sans face — monospacing a
  // quantity buys nothing.
  const stats: {
    label: string;
    value: ReactNode;
    hint: string;
    tone?: "default" | "lead";
  }[] = [
    {
      label: "Expenses tracked",
      value: expenses.length,
      hint: expenses.length === 0 ? "Add your first expense" : "all time",
    },
    {
      label: "This month",
      value: <Amount value={thisMonthTotal} size="inherit" />,
      hint: "recorded so far",
      // The question this dashboard exists to answer.
      tone: "lead",
    },
    {
      label: "This year",
      value: <Amount value={thisYearTotal} size="inherit" />,
      hint: `in ${currentYear}`,
    },
    {
      label: "Categories",
      value: categoriesUsed,
      hint: "in use",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          {expenses.length > recentExpenses.length && (
            <CardAction>
              <button
                type="button"
                onClick={() => onViewHistory?.()}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all {expenses.length}
                <ArrowRight className="size-3.5" />
              </button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentExpenses.map((expense) => (
              <RecordCard
                key={expense.id}
                name={expense.provider_name}
                amount={expense.amount}
                category={expense.category}
                meta={formatDate(expense.date)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
