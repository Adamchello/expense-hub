import type { Bill } from "@/modules/bill-management/domain/bill";

export interface CategoryTotal {
  category: string;
  total: number;
  /** Share of the grand total, 0-100. */
  share: number;
}

export interface MonthlyTotal {
  /** YYYY-MM */
  month: string;
  total: number;
}

export interface CategoryComparison {
  category: string;
  current: number;
  previous: number;
  /** Percent change vs previous month; null when there is no previous spending. */
  changePct: number | null;
}

const monthOf = (bill: Bill) => bill.date.slice(0, 7);

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Spending distribution across categories, largest first. */
export function totalsByCategory(
  bills: Bill[],
  month?: string,
): CategoryTotal[] {
  const scoped = month
    ? bills.filter((bill) => monthOf(bill) === month)
    : bills;
  const totals = new Map<string, number>();
  for (const bill of scoped) {
    totals.set(bill.category, (totals.get(bill.category) ?? 0) + bill.amount);
  }
  const grandTotal = sum([...totals.values()]);
  return [...totals.entries()]
    .map(([category, total]) => ({
      category,
      total,
      share: grandTotal > 0 ? round1((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Chronological month totals, only months that have bills. */
export function monthlyTotals(bills: Bill[]): MonthlyTotal[] {
  const totals = new Map<string, number>();
  for (const bill of bills) {
    const month = monthOf(bill);
    totals.set(month, (totals.get(month) ?? 0) + bill.amount);
  }
  return [...totals.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Average spend across months that have at least one bill. */
export function averageMonthlySpending(bills: Bill[]): number {
  const months = monthlyTotals(bills);
  if (months.length === 0) return 0;
  return sum(months.map((m) => m.total)) / months.length;
}

/** Per-category current vs previous month, sorted by biggest absolute swing. */
export function categoryComparisons(
  bills: Bill[],
  currentMonth: string,
  previousMonth: string,
): CategoryComparison[] {
  const current = new Map(
    totalsByCategory(bills, currentMonth).map((c) => [c.category, c.total]),
  );
  const previous = new Map(
    totalsByCategory(bills, previousMonth).map((c) => [c.category, c.total]),
  );
  const categories = new Set([...current.keys(), ...previous.keys()]);

  return [...categories]
    .map((category) => {
      const cur = current.get(category) ?? 0;
      const prev = previous.get(category) ?? 0;
      return {
        category,
        current: cur,
        previous: prev,
        changePct: prev > 0 ? round1(((cur - prev) / prev) * 100) : null,
      };
    })
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort(
      (a, b) =>
        Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous),
    );
}

const RANK_LABELS = ["largest", "second-largest", "third-largest"];

const previousMonthOf = (month: string): string => {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 2, 1));
  return date.toISOString().slice(0, 7);
};

/**
 * Descriptive, factual summaries derived from recorded bills — no predictions.
 * `currentMonth` is YYYY-MM.
 */
export function spendingSummaries(
  bills: Bill[],
  currentMonth: string,
): string[] {
  const summaries: string[] = [];
  const lastMonth = previousMonthOf(currentMonth);

  // 1. Biggest category share this month.
  const thisMonth = totalsByCategory(bills, currentMonth);
  const biggest = thisMonth[0];
  if (biggest && biggest.share > 0) {
    summaries.push(
      `${biggest.category} represented ${biggest.share}% of your spending this month.`,
    );
  }

  // 2. Rank changes vs last month ("became your second-largest category").
  const lastRanks = totalsByCategory(bills, lastMonth).map((c) => c.category);
  thisMonth.slice(0, RANK_LABELS.length).forEach((entry, rank) => {
    const lastRank = lastRanks.indexOf(entry.category);
    if (lastRanks.length > 0 && lastRank !== -1 && lastRank > rank) {
      summaries.push(
        `${entry.category} became your ${RANK_LABELS[rank]} expense category.`,
      );
    }
  });

  // 3. Biggest month-over-month movers.
  const comparisons = categoryComparisons(bills, currentMonth, lastMonth)
    .filter((c) => c.changePct !== null && c.changePct !== 0)
    .slice(0, 2);
  for (const comparison of comparisons) {
    const pct = Math.abs(comparison.changePct!);
    const direction = comparison.changePct! > 0 ? "increased" : "decreased";
    summaries.push(
      `${comparison.category} ${direction} by ${pct}% compared to last month.`,
    );
  }

  // 4. Three-month monotonic category trends.
  const months = [previousMonthOf(lastMonth), lastMonth, currentMonth];
  const byMonth = months.map(
    (month) =>
      new Map(totalsByCategory(bills, month).map((c) => [c.category, c.total])),
  );
  const trendCategories = new Set(byMonth.flatMap((m) => [...m.keys()]));
  for (const category of trendCategories) {
    const [a, b, c] = byMonth.map((m) => m.get(category) ?? 0);
    if (a > 0 && b > 0 && c > 0) {
      if (a < b && b < c) {
        summaries.push(
          `${category} spending increased over the last three months.`,
        );
      } else if (a > b && b > c) {
        summaries.push(
          `${category} spending decreased over the last three months.`,
        );
      }
    }
  }

  return summaries.slice(0, 6);
}
