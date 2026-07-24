"use client";

import { useMemo } from "react";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { DashboardOverview } from "@/modules/expense-management/presentation/dashboard-overview";
import { RecentExpensesCard } from "@/modules/expense-management/presentation/recent-expenses-card";
import { IncomingPayments } from "@/modules/recurring-payments/presentation/incoming-payments";
import { TopCategoriesCard } from "@/modules/spending-analytics/presentation/top-categories-card";

/**
 * The dashboard's composition root.
 *
 * Modules own their own cards; which cards appear, in what order, and what
 * period they answer for is a shell decision — this is the only place that
 * imports across four modules, and it does so to arrange them, not to reach
 * into them.
 *
 * The reading order is fixed and mobile-first: totals, then what just
 * happened, then what is about to happen, then where it is all going. On a
 * phone that is one column top to bottom; the wide layout only pairs the two
 * middle cards, it never reorders them.
 *
 * The period is always the current month. A picker lived here briefly; the
 * dashboard is the "how am I doing right now" view, and History already owns
 * looking backwards with filters and sorting built for it. The month is still
 * threaded through as a value rather than read from the clock inside each card
 * — every card has to answer for the same month, and that is the shell's call
 * to make, not four separate calls to `new Date()`.
 */
interface DashboardViewProps {
  expenses: Expense[];
  greeting: string;
  onAddExpense: (tab: "single" | "import") => void;
  onNavigate: (
    tab: "history" | "analytics",
    view?: "list" | "calendar",
  ) => void;
}

export function DashboardView({
  expenses,
  greeting,
  onAddExpense,
  onNavigate,
}: DashboardViewProps) {
  const month = new Date().toISOString().slice(0, 7);

  const recent = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, month],
  );

  const isEmpty = expenses.length === 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {greeting}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here&rsquo;s what&rsquo;s happening with your finances.
        </p>
      </div>

      <DashboardOverview
        expenses={expenses}
        month={month}
        onAddExpense={onAddExpense}
      />

      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RecentExpensesCard
              expenses={recent}
              onViewAll={() => onNavigate("history")}
            />
            <IncomingPayments
              onViewAll={() => onNavigate("history", "calendar")}
            />
          </div>

          <TopCategoriesCard
            expenses={expenses}
            month={month}
            onViewReport={() => onNavigate("analytics")}
          />
        </>
      )}
    </div>
  );
}
