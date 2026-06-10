import { mock } from "@/__e2e__/mock";
import type {
  Insight,
  InsightType,
  InsightSentiment,
  InsightIconHint,
  InsightComparison,
  InsightsResponse,
} from "../domain/insights";

const DEFAULT_GENERATED_AT = "2026-05-21T00:00:00Z";

interface InsightOverrides {
  type?: InsightType;
  priority?: number;
  title?: string;
  description?: string;
  category?: Insight["category"];
  iconHint?: InsightIconHint;
  sentiment?: InsightSentiment;
  comparison?: InsightComparison;
}

const TYPE_DEFAULTS: Record<
  InsightType,
  { iconHint: InsightIconHint; sentiment: InsightSentiment; priority: number }
> = {
  "spending-spike": {
    iconHint: "alert-triangle",
    sentiment: "warning",
    priority: 1,
  },
  "seasonal-pattern": {
    iconHint: "calendar",
    sentiment: "neutral",
    priority: 2,
  },
  "budget-trajectory": {
    iconHint: "trending-up",
    sentiment: "warning",
    priority: 2,
  },
  "new-category": {
    iconHint: "plus-circle",
    sentiment: "neutral",
    priority: 3,
  },
  "subscription-creep": {
    iconHint: "layers",
    sentiment: "warning",
    priority: 3,
  },
  "top-spending-category": {
    iconHint: "bar-chart",
    sentiment: "neutral",
    priority: 5,
  },
  "category-consolidation": {
    iconHint: "target",
    sentiment: "positive",
    priority: 4,
  },
  "month-over-month": {
    iconHint: "trending-down",
    sentiment: "positive",
    priority: 4,
  },
  "spending-diversity": {
    iconHint: "pie-chart",
    sentiment: "neutral",
    priority: 5,
  },
};

export const buildInsight = (overrides: InsightOverrides = {}): Insight => {
  const type = overrides.type ?? "spending-spike";
  const defaults = TYPE_DEFAULTS[type];
  return {
    type,
    priority: defaults.priority,
    title: `${type} title`,
    description: `${type} description`,
    iconHint: defaults.iconHint,
    sentiment: defaults.sentiment,
    ...overrides,
  };
};

export const insights = (first: InsightOverrides = {}) =>
  mock<Insight>([buildInsight(first)]);

export const insightsResponse = (
  list: Insight[],
  dataQuality: InsightsResponse["dataQuality"] = "full",
): InsightsResponse => ({
  dataQuality,
  generatedAt: DEFAULT_GENERATED_AT,
  insights: list,
});

export const emptyInsightsResponse = (): InsightsResponse => ({
  dataQuality: "full",
  generatedAt: DEFAULT_GENERATED_AT,
  insights: [],
});
