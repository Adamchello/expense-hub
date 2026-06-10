import { mock } from "@/__e2e__/mock";
import type {
  CategoryMonthForecast,
  CategorySummary,
  ForecastResponse,
  MonthlyTotal,
} from "../domain/forecast";
import type { Category } from "@/shared/domain/category";

const DEFAULT_GENERATED_AT = "2026-05-21T00:00:00Z";

export const buildMonthlyTotal = (
  overrides: Partial<MonthlyTotal> = {},
): MonthlyTotal => ({
  month: "2026-06",
  total: 1500,
  confidence: { low: 1400, high: 1600 },
  ...overrides,
});

export const buildCategoryForecast = (
  overrides: Partial<CategoryMonthForecast> = {},
): CategoryMonthForecast => ({
  month: "2026-06",
  predictedAmount: 300,
  confidence: { low: 280, high: 320 },
  trend: "stable",
  billCount: 3,
  ...overrides,
});

export const buildCategorySummary = (
  overrides: Partial<CategorySummary> & { category: Category },
): CategorySummary => ({
  trend: "stable",
  avgMonthlyAmount: 300,
  forecasts: [buildCategoryForecast()],
  ...overrides,
});

export const monthlyTotals = (first: Partial<MonthlyTotal> = {}) =>
  mock<MonthlyTotal>([buildMonthlyTotal(first)]);

export const categorySummaries = (
  first: Partial<CategorySummary> & { category: Category },
) => mock<CategorySummary>([buildCategorySummary(first)]);

interface ForecastResponseOverrides {
  yearlyProjection?: number;
  monthlyTotals?: MonthlyTotal[];
  categorySummaries?: CategorySummary[];
  dataQuality?: ForecastResponse["dataQuality"];
}

export const forecastResponse = (
  overrides: ForecastResponseOverrides = {},
): ForecastResponse => ({
  yearlyProjection: 18000,
  monthlyTotals: overrides.monthlyTotals ?? [buildMonthlyTotal()],
  categorySummaries: overrides.categorySummaries ?? [
    buildCategorySummary({ category: "Utilities" }),
  ],
  dataQuality: overrides.dataQuality ?? "full",
  generatedAt: DEFAULT_GENERATED_AT,
  ...overrides,
});

export const emptyForecastResponse = (): ForecastResponse => ({
  yearlyProjection: 0,
  monthlyTotals: [],
  categorySummaries: [],
  dataQuality: "full",
  generatedAt: DEFAULT_GENERATED_AT,
});
