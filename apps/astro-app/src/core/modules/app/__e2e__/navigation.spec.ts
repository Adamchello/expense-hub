import { test, expect, type Page } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/shared/auth/__e2e__/login";

const sidebar = (page: Page) =>
  page.locator("aside").getByRole("navigation", { name: "Main" });

const commands = {
  "open the app": async (page: Page) => {
    await page.goto("/app");
  },

  "open a legacy tab link": async (page: Page, tab: string, view?: string) => {
    const search = new URLSearchParams({ tab, ...(view ? { view } : {}) });
    await page.goto(`/app?${search}`);
  },

  "click sidebar destination": async (page: Page, name: string) => {
    await sidebar(page).getByRole("link", { name }).click();
  },

  "switch history view": async (page: Page, name: string) => {
    await page
      .getByRole("group", { name: "History view" })
      .getByRole("button", { name })
      .click();
  },

  "switch settings section": async (page: Page, name: string) => {
    await page
      .getByRole("group", { name: "Settings section" })
      .getByRole("button", { name })
      .click();
  },

  "land on": async (page: Page, path: string, title: string) => {
    await expect(page).toHaveURL(path);
    await expect(page).toHaveTitle(`${title} · ExpenseHub`);
  },

  "sidebar marks current": async (page: Page, name: string) => {
    const current = sidebar(page).getByRole("link", { name });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(sidebar(page).locator('a[aria-current="page"]')).toHaveCount(
      1,
    );
  },

  "see page heading": async (page: Page, pattern: RegExp) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pattern);
  },

  "open add expense from sidebar": async (page: Page) => {
    await sidebar(page)
      .locator("..")
      .getByRole("button", { name: /add expense/i })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /single expense/i }),
    ).toHaveAttribute("aria-selected", "true");
  },
};

const run = interpreter(commands);

test.describe("App navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("/app lands on the dashboard with the greeting", async ({ page }) => {
    await run(
      ["open the app", page],
      ["land on", page, "/app/dashboard", "Dashboard"],
      ["sidebar marks current", page, "Dashboard"],
      ["see page heading", page, /^Good (morning|afternoon|evening)/],
    );
  });

  test("sidebar links move between views and keep one current", async ({
    page,
  }) => {
    await run(
      ["open the app", page],
      ["click sidebar destination", page, "History"],
      ["land on", page, "/app/history", "History"],
      ["sidebar marks current", page, "History"],
      ["see page heading", page, /^History$/],
      ["click sidebar destination", page, "Analytics"],
      ["land on", page, "/app/analytics", "Spending analytics"],
      ["sidebar marks current", page, "Analytics"],
      ["click sidebar destination", page, "Settings"],
      ["land on", page, "/app/settings/profiles", "Settings"],
      ["sidebar marks current", page, "Settings"],
    );
  });

  test("settings sections are their own paths and keep Settings current", async ({
    page,
  }) => {
    await run(
      ["open the app", page],
      ["click sidebar destination", page, "Settings"],
      ["switch settings section", page, "Categories"],
      ["land on", page, "/app/settings/categories", "Settings"],
      ["sidebar marks current", page, "Settings"],
      ["switch settings section", page, "Merchants"],
      ["land on", page, "/app/settings/merchants", "Settings"],
      ["switch settings section", page, "Profiles"],
      ["land on", page, "/app/settings/profiles", "Settings"],
    );
  });

  test("history's calendar is its own path and keeps History current", async ({
    page,
  }) => {
    await run(
      ["open the app", page],
      ["click sidebar destination", page, "History"],
      ["switch history view", page, "Calendar"],
      ["land on", page, "/app/history/calendar", "History"],
      ["sidebar marks current", page, "History"],
      ["switch history view", page, "List"],
      ["land on", page, "/app/history", "History"],
    );
  });

  test("legacy ?tab= links redirect, including the retired recurring tab", async ({
    page,
  }) => {
    await run(
      ["open a legacy tab link", page, "recurring", "calendar"],
      ["land on", page, "/app/history/calendar", "History"],
      ["open a legacy tab link", page, "nonsense"],
      ["land on", page, "/app/dashboard", "Dashboard"],
    );
  });

  test("the sidebar's add expense opens the dialog on the single tab", async ({
    page,
  }) => {
    await run(["open the app", page], ["open add expense from sidebar", page]);
  });
});
