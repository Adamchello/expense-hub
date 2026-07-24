"use client";

import type { Expense } from "../domain/expense";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { SpendingHeroCard } from "./spending-hero-card";
import { formatMonth, formatMonthRange } from "@/shared/format";
import {
  changePct,
  previousMonthOf,
  rangeTotal,
  sameMonthLastYear,
} from "@/modules/spending-analytics/core/analytics";
import { FileSpreadsheet, Plus, Receipt } from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  expenses: Expense[];
  /** The month being reported, YYYY-MM. */
  month: string;
  /** Opens the add-expense dialog on the given tab (used by the empty state). */
  onAddExpense?: (tab: "single" | "import") => void;
}

/**
 * The two headline figures: the selected month, and the year up to it.
 *
 * Both are shown against the equivalent earlier period rather than as bare
 * totals. "$2,549" alone is not a fact anyone can act on — "$2,549, down 8.6%
 * on last month" is. The year card deliberately runs January→selected month
 * on both sides of the comparison, so a partial year is never measured against
 * a complete one.
 */
export function DashboardOverview({
  expenses,
  month,
  onAddExpense,
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

  const previousMonth = previousMonthOf(month);
  const monthNow = rangeTotal(expenses, month, month);
  const monthThen = rangeTotal(expenses, previousMonth, previousMonth);

  const year = month.slice(0, 4);
  const yearStart = `${year}-01`;
  const previousYearStart = `${Number(year) - 1}-01`;
  const previousYearEnd = sameMonthLastYear(month);
  const yearNow = rangeTotal(expenses, yearStart, month);
  const yearThen = rangeTotal(expenses, previousYearStart, previousYearEnd);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SpendingHeroCard
        label="Spending this month"
        total={monthNow.total}
        changePct={changePct(monthNow.total, monthThen.total)}
        comparisonLabel={formatMonth(previousMonth)}
        art="hills"
      />
      <SpendingHeroCard
        label="Spending this year"
        total={yearNow.total}
        changePct={changePct(yearNow.total, yearThen.total)}
        comparisonLabel={formatMonthRange(previousYearStart, previousYearEnd)}
        art="plant"
      />
    </div>
  );
}
