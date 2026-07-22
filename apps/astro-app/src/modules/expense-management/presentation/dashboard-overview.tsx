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

  // Each period answers the same two things: how much, and over how many
  // expenses. A bare count ("5 tracked all time") and a category tally drove
  // no decision, so they're folded in here or dropped.
  const summarize = (prefix: string) => {
    const inPeriod = expenses.filter((expense) =>
      expense.date.startsWith(prefix),
    );
    return {
      total: inPeriod.reduce((sum, expense) => sum + expense.amount, 0),
      count: inPeriod.length,
    };
  };

  const countHint = (count: number) =>
    count === 0
      ? "nothing recorded yet"
      : `across ${count} ${count === 1 ? "expense" : "expenses"}`;

  const month = summarize(currentMonth);
  const year = summarize(currentYear);

  const stats: { label: string; value: ReactNode; hint: string }[] = [
    {
      label: "This month",
      value: <Amount value={month.total} size="inherit" />,
      hint: countHint(month.count),
    },
    {
      label: "This year",
      value: <Amount value={year.total} size="inherit" />,
      hint: countHint(year.count),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Two periods side by side, weighted equally — one is not more important
          than the other, they're the same question at two scales. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
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
