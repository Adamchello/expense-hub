import { test, expect, type Page } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/__e2e__/auth";
import { getById } from "@/__e2e__/data-e2e";
import { expenseRows, toCsv } from "./mocks";

const commands = {
  "navigate to dashboard": async (page: Page) => {
    await page.goto("/app");
  },

  "open import panel": async (page: Page) => {
    await page.getByRole("button", { name: /add expense/i }).click();
    await page.getByRole("tab", { name: /import file/i }).click();
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Import Expenses",
    );
  },

  "upload valid CSV file": async (page: Page) => {
    const csv = toCsv(
      expenseRows()
        .append(
          {
            amount: "45.00",
            date: "2024-01-20",
            provider: "Netflix",
            description: "Subscription",
          },
          {
            amount: "89.99",
            date: "2024-02-01",
            provider: "Water Utility",
            description: "Quarterly",
          },
        )
        .build(),
    );

    const fileChooserPromise = page.waitForEvent("filechooser");
    await getById(page, "expense-import.dropzone").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
  },

  "see review table with parsed rows": async (page: Page) => {
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Review Import",
    );
    await expect(getById(page, "expense-import.table")).toBeVisible();
  },

  "see import summary section": async (page: Page) => {
    await expect(getById(page, "expense-import.stats")).toBeVisible();
  },

  "finalize import": async (page: Page) => {
    await getById(page, "expense-import.button.finalize").click();
  },

  "see success confirmation": async (page: Page) => {
    await expect(getById(page, "expense-import.state.success")).toBeVisible();
  },

  "see error rows highlighted": async (page: Page) => {
    await expect(
      getById(page, "expense-import.row.error").first(),
    ).toBeVisible();
  },

  "see duplicate indicator": async (page: Page) => {
    await expect(
      getById(page, "expense-import.stats.duplicates"),
    ).toBeVisible();
  },

  "see error indicators on row": async (page: Page) => {
    await expect(getById(page, "expense-import.stats.errors")).toBeVisible();
  },

  "see file parse error": async (page: Page) => {
    await expect(getById(page, "expense-import.dropzone.errors")).toBeVisible();
  },

  "see processing indicator": async (page: Page) => {
    await expect(
      getById(page, "expense-import.dropzone.processing"),
    ).toBeVisible();
  },

  "cancel import": async (page: Page) => {
    await getById(page, "expense-import.button.cancel").click();
  },

  "import panel is closed": async (page: Page) => {
    await expect(getById(page, "expense-import.title")).not.toBeVisible();
  },
};

const run = interpreter(commands);

test.describe("CSV Import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("user uploads CSV and reaches review state", async ({ page }) => {
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["upload valid CSV file", page],
      ["see review table with parsed rows", page],
      ["see import summary section", page],
    );
  });

  test("user can cancel and close the import panel", async ({ page }) => {
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["cancel import", page],
      ["import panel is closed", page],
    );
  });
});
