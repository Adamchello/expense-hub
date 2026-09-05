import { test, expect, type Page } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/__e2e__/auth";
import { getById } from "@/__e2e__/data-e2e";
import { extractReply, extractedRows } from "./mocks";

// The model endpoint is stubbed at the network layer: no API key, no spend,
// and the flow under test is the UI plus the client-side pipeline.

const commands = {
  "navigate to dashboard": async (page: Page) => {
    await page.goto("/app");
  },

  "open import panel": async (page: Page) => {
    await page.getByRole("button", { name: /add expense/i }).click();
    await page.getByRole("tab", { name: /import file/i }).click();
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Import expenses",
    );
  },

  "model returns two expenses with a warning": async (page: Page) => {
    await page.route("**/api/expenses/extract", (route) =>
      route.fulfill({
        json: extractReply(extractedRows().build(), [
          "Skipped 1 incoming transfer",
        ]),
      }),
    );
  },

  "model fails": async (page: Page) => {
    await page.route("**/api/expenses/extract", (route) =>
      route.fulfill({
        status: 500,
        json: {
          code: 500,
          type: "internal-server",
          message: "Could not read expenses from this file.",
        },
      }),
    );
  },

  "upload PDF statement": async (page: Page) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await getById(page, "expense-import.dropzone").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "statement.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 stub", "utf-8"),
    });
  },

  "see review table with extracted rows": async (page: Page) => {
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Review import",
    );
    await expect(getById(page, "expense-import.table")).toBeVisible();
    await expect(
      getById(page, "expense-import.table").locator('input[value="Netflix"]'),
    ).toBeVisible();
  },

  "see model warning": async (page: Page) => {
    await expect(getById(page, "expense-import.state.warnings")).toContainText(
      "Skipped 1 incoming transfer",
    );
  },

  "see file read error": async (page: Page) => {
    await expect(getById(page, "expense-import.dropzone.errors")).toContainText(
      "Could not read expenses from this file",
    );
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Import expenses",
    );
  },
};

const run = interpreter(commands);

test.describe("PDF Import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("user uploads a PDF and reviews what the model extracted", async ({
    page,
  }) => {
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["model returns two expenses with a warning", page],
      ["upload PDF statement", page],
      ["see review table with extracted rows", page],
      ["see model warning", page],
    );
  });

  test("user sees the error and stays on upload when the model fails", async ({
    page,
  }) => {
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["model fails", page],
      ["upload PDF statement", page],
      ["see file read error", page],
    );
  });
});
