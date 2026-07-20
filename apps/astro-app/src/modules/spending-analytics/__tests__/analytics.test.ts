import { describe, expect, it } from "vitest";
import type { Expense } from "@/modules/expense-management/domain/expense";
import {
  averageMonthlySpending,
  categoryComparisons,
  monthlyTotals,
  spendingSummaries,
  totalsByCategory,
} from "../core/analytics";

let expenseId = 0;
const expense = (date: string, amount: number, category: string): Expense => ({
  id: String(++expenseId),
  amount,
  date,
  provider_name: "Provider",
  description: null,
  category: category as Expense["category"],
  created_at: `${date}T00:00:00Z`,
});

const FIXTURE: Expense[] = [
  // May
  expense("2026-05-05", 100, "Rent"),
  expense("2026-05-10", 40, "Groceries"),
  expense("2026-05-15", 30, "Entertainment"),
  // June
  expense("2026-06-05", 100, "Rent"),
  expense("2026-06-10", 50, "Groceries"),
  expense("2026-06-15", 20, "Entertainment"),
  // July (current)
  expense("2026-07-05", 100, "Rent"),
  expense("2026-07-10", 56, "Groceries"),
  expense("2026-07-15", 10, "Entertainment"),
  expense("2026-07-16", 60, "Fuel"),
];

describe("totalsByCategory", () => {
  it("computes distribution largest-first with shares", () => {
    const result = totalsByCategory(FIXTURE, "2026-07");
    expect(result[0]).toEqual({ category: "Rent", total: 100, share: 44.2 });
    expect(result.map((r) => r.category)).toEqual([
      "Rent",
      "Fuel",
      "Groceries",
      "Entertainment",
    ]);
    expect(Math.round(result.reduce((s, r) => s + r.share, 0))).toBe(100);
  });

  it("covers all history when month is omitted", () => {
    const all = totalsByCategory(FIXTURE);
    expect(all[0].category).toBe("Rent");
    expect(all[0].total).toBe(300);
  });
});

describe("monthlyTotals", () => {
  it("returns chronological month totals", () => {
    expect(monthlyTotals(FIXTURE)).toEqual([
      { month: "2026-05", total: 170 },
      { month: "2026-06", total: 170 },
      { month: "2026-07", total: 226 },
    ]);
  });
});

describe("averageMonthlySpending", () => {
  it("averages across months with data", () => {
    expect(averageMonthlySpending(FIXTURE)).toBeCloseTo(188.67, 1);
  });

  it("is zero without expenses", () => {
    expect(averageMonthlySpending([])).toBe(0);
  });
});

describe("categoryComparisons", () => {
  it("computes month-over-month change per category", () => {
    const result = categoryComparisons(FIXTURE, "2026-07", "2026-06");
    const groceries = result.find((c) => c.category === "Groceries");
    expect(groceries).toEqual({
      category: "Groceries",
      current: 56,
      previous: 50,
      changePct: 12,
    });
    const fuel = result.find((c) => c.category === "Fuel");
    expect(fuel?.changePct).toBeNull(); // new category, no baseline
  });
});

describe("spendingSummaries", () => {
  it("includes the biggest-category share", () => {
    const summaries = spendingSummaries(FIXTURE, "2026-07");
    expect(summaries).toContain(
      "Rent represented 44.2% of your spending this month.",
    );
  });

  it("reports month-over-month movers", () => {
    const summaries = spendingSummaries(FIXTURE, "2026-07");
    expect(summaries).toContain(
      "Groceries increased by 12% compared to last month.",
    );
  });

  it("reports three-month monotonic trends", () => {
    const summaries = spendingSummaries(FIXTURE, "2026-07");
    expect(summaries).toContain(
      "Entertainment spending decreased over the last three months.",
    );
  });

  it("reports rank climbs", () => {
    const expenses = [
      ...FIXTURE,
      // June: Fuel was only $5 (5th place); in July it jumps to $60 (2nd place).
      expense("2026-06-20", 5, "Fuel"),
    ];
    const summaries = spendingSummaries(expenses, "2026-07");
    expect(summaries).toContain(
      "Fuel became your second-largest expense category.",
    );
  });

  it("is empty without any expenses", () => {
    expect(spendingSummaries([], "2026-07")).toEqual([]);
  });
});
