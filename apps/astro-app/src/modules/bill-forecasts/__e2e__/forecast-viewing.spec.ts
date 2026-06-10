import { test, expect, type Page } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/__e2e__/auth";
import { getById } from "@/__e2e__/data-e2e";
import {
  buildCategorySummary,
  categorySummaries,
  emptyForecastResponse,
  forecastResponse,
  monthlyTotals,
} from "./mocks";

const fullForecast = forecastResponse({
  yearlyProjection: 18600,
  monthlyTotals: monthlyTotals({ month: "2026-06" })
    .append({
      month: "2026-07",
      total: 1580,
      confidence: { low: 1420, high: 1740 },
    })
    .append({
      month: "2026-08",
      total: 1600,
      confidence: { low: 1450, high: 1750 },
    })
    .build(),
  categorySummaries: categorySummaries({ category: "Utilities" })
    .append(buildCategorySummary({ category: "Housing", trend: "decreasing" }))
    .append(buildCategorySummary({ category: "Subscriptions" }))
    .build(),
});

const limitedForecast = forecastResponse({
  yearlyProjection: 7200,
  dataQuality: "limited",
  monthlyTotals: monthlyTotals({ month: "2026-06", total: 600 }).build(),
  categorySummaries: categorySummaries({ category: "Utilities" }).build(),
});

const emptyForecast = emptyForecastResponse();

const FORECAST_URL = "**/api/bills/forecast";

const commands = {
  "mock full forecast API": async (page: Page) => {
    await page.route(FORECAST_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: fullForecast }),
      }),
    );
  },

  "mock limited forecast API": async (page: Page) => {
    await page.route(FORECAST_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: limitedForecast }),
      }),
    );
  },

  "mock empty forecast API": async (page: Page) => {
    await page.route(FORECAST_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: emptyForecast }),
      }),
    );
  },

  "mock failing forecast API": async (page: Page) => {
    await page.route(FORECAST_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({}),
      }),
    );
  },

  "navigate to forecasts tab": async (page: Page) => {
    await page.goto("/app");
    await page.getByRole("tab", { name: /forecasts/i }).click();
  },

  "see forecast content loaded": async (page: Page) => {
    await expect(
      getById(page, "bill-forecasts.section.yearly-projection"),
    ).toBeVisible();
    await expect(
      getById(page, "bill-forecasts.section.monthly-forecast"),
    ).toBeVisible();
    await expect(
      getById(page, "bill-forecasts.section.by-category"),
    ).toBeVisible();
  },

  "see limited data warning banner": async (page: Page) => {
    await expect(
      getById(page, "bill-forecasts.state.limited-warning"),
    ).toBeVisible();
  },

  "see empty state guidance": async (page: Page) => {
    await expect(getById(page, "bill-forecasts.state.empty")).toBeVisible();
  },

  "see error state": async (page: Page) => {
    await expect(getById(page, "bill-forecasts.state.error")).toBeVisible({
      timeout: 15000,
    });
  },

  "forecast sections are not rendered": async (page: Page) => {
    await expect(
      getById(page, "bill-forecasts.section.yearly-projection"),
    ).not.toBeVisible();
    await expect(
      getById(page, "bill-forecasts.section.monthly-forecast"),
    ).not.toBeVisible();
  },
};

const run = interpreter(commands);

test.describe("Forecast Viewing", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("user navigates to forecasts and sees full content", async ({
    page,
  }) => {
    await run(
      ["mock full forecast API", page],
      ["navigate to forecasts tab", page],
      ["see forecast content loaded", page],
    );
  });

  test("user with limited history sees a warning", async ({ page }) => {
    await run(
      ["mock limited forecast API", page],
      ["navigate to forecasts tab", page],
      ["see limited data warning banner", page],
    );
  });

  test("user with no bills is guided to add data", async ({ page }) => {
    await run(
      ["mock empty forecast API", page],
      ["navigate to forecasts tab", page],
      ["see empty state guidance", page],
      ["forecast sections are not rendered", page],
    );
  });

  test("user sees error state when API fails", async ({ page }) => {
    await run(
      ["mock failing forecast API", page],
      ["navigate to forecasts tab", page],
      ["see error state", page],
      ["forecast sections are not rendered", page],
    );
  });
});
