"use client";

import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Callout, errorMessage } from "@/libs/ui/callout";
import { SkeletonDashboard } from "@/libs/ui/skeleton";
import { useAuth } from "@/shared/auth/use-auth";
import { greetingFor } from "@/shared/user/user-display";
import { todayIso } from "@/shared/calendar/calendar";
import { appTabPath } from "@/shared/routing/app-router";
import { openAddExpense } from "@/modules/add-expense/core/intent";
import { useExpenses } from "@/modules/expense-management/core/store";
import {
  expensesInMonth,
  newestFirst,
} from "@/modules/expense-management/core/selectors";
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
 * The period is always the current month. History already owns looking
 * backwards with filters and sorting built for it. The month is threaded
 * through as a value rather than read from the clock inside each card — every
 * card has to answer for the same month, and that is the shell's call to
 * make, not four separate calls to the clock.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const email = auth.status === "authenticated" ? auth.user?.email : "";
  const greeting = greetingFor(email);

  const query = useExpenses();
  const expenses = query.data ?? [];
  const month = todayIso().slice(0, 7);

  const recent = useMemo(
    () => newestFirst(expensesInMonth(expenses, month)),
    [expenses, month],
  );

  if (query.isLoading) {
    return <SkeletonDashboard />;
  }

  const isEmpty = expenses.length === 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {query.error && (
        <Callout variant="error">
          {errorMessage(query.error, "Failed to load expenses")}
        </Callout>
      )}

      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {greeting}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your spending so far, and what&rsquo;s due next.
        </p>
      </div>

      <DashboardOverview
        expenses={expenses}
        month={month}
        onAddExpense={(tab) => openAddExpense({ tab })}
      />

      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RecentExpensesCard
              expenses={recent}
              onViewAll={() =>
                navigate({ to: appTabPath("history"), replace: true })
              }
            />
            <IncomingPayments
              onViewAll={() =>
                navigate({
                  to: appTabPath("history", "calendar"),
                  replace: true,
                })
              }
            />
          </div>

          <TopCategoriesCard
            expenses={expenses}
            month={month}
            onViewReport={() =>
              navigate({ to: appTabPath("analytics"), replace: true })
            }
          />
        </>
      )}
    </div>
  );
}
