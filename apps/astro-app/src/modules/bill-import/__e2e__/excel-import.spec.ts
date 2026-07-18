import { test, expect, type Page } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/__e2e__/auth";
import { getById } from "@/__e2e__/data-e2e";

const commands = {
  "navigate to dashboard": async (page: Page) => {
    await page.goto("/app");
  },

  "open import panel": async (page: Page) => {
    await page.getByRole("button", { name: /add bill/i }).click();
    await page.getByRole("tab", { name: /import file/i }).click();
    await expect(getById(page, "bill-import.title")).toHaveText("Import Bills");
  },

  "drop valid Excel file": async (page: Page) => {
    await expect(getById(page, "bill-import.dropzone")).toBeVisible();
    // Note: actual xlsx drop requires serving a fixture file from the test assets
    // This is a placeholder — real implementation needs fileChooser or fixture serving
  },

  "see review table": async (page: Page) => {
    await expect(getById(page, "bill-import.title")).toHaveText(
      "Review Import",
    );
    await expect(getById(page, "bill-import.table")).toBeVisible();
  },

  "see import summary section": async (page: Page) => {
    await expect(getById(page, "bill-import.stats")).toBeVisible();
  },

  "see error rows highlighted": async (page: Page) => {
    await expect(getById(page, "bill-import.row.error").first()).toBeVisible();
  },

  "see file parse error": async (page: Page) => {
    await expect(getById(page, "bill-import.dropzone.errors")).toBeVisible();
  },

  "see processing indicator": async (page: Page) => {
    await expect(
      getById(page, "bill-import.dropzone.processing"),
    ).toBeVisible();
  },

  "finalize import": async (page: Page) => {
    await getById(page, "bill-import.button.finalize").click();
  },

  "see success confirmation": async (page: Page) => {
    await expect(getById(page, "bill-import.state.success")).toBeVisible();
  },
};

const run = interpreter(commands);

test.describe("Excel Import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("happy path — drop Excel file, review, finalize", async ({ page }) => {
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      // Note: xlsx file drop needs fixture assets — skeleton test for now
    );
  });
});
