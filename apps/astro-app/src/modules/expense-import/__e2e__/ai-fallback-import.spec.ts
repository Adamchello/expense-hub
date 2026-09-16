import { test, expect, type Page, type Request } from "@playwright/test";
import { interpreter } from "@/__e2e__/interpreter";
import { loginAs } from "@/shared/auth/__e2e__/login";
import { getById } from "@/__e2e__/data-e2e";
import { extractReply, extractedRows } from "./mocks";

// A CSV whose headers the heuristic mapper cannot read must go to the model;
// one with recognizable headers must not. Both stubbed at the network layer.

type Captured = { requests: Request[] };

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

  "stub model and capture calls": async (page: Page, captured: Captured) => {
    await page.route("**/api/expenses/extract", (route) => {
      captured.requests.push(route.request());
      return route.fulfill({
        json: extractReply(extractedRows().build(), []),
      });
    });
  },

  "upload CSV with Polish headers": async (page: Page) => {
    const csv = [
      "Data,Kwota,Odbiorca",
      '2024-03-01,"12,50",Netflix',
      '2024-03-02,"9,99",Spotify',
    ].join("\n");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await getById(page, "expense-import.dropzone").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "bank.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
  },

  "upload CSV with recognizable headers": async (page: Page) => {
    const csv = ["amount,date,provider", "12.50,2024-03-01,Netflix"].join("\n");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await getById(page, "expense-import.dropzone").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
  },

  "see review table": async (page: Page) => {
    await expect(getById(page, "expense-import.title")).toHaveText(
      "Review import",
    );
    await expect(getById(page, "expense-import.table")).toBeVisible();
  },

  "model received the headers and rows": async (
    _page: Page,
    captured: Captured,
  ) => {
    expect(captured.requests).toHaveLength(1);
    const body = captured.requests[0].postDataJSON();
    expect(body).toMatchObject({
      kind: "rows",
      fileName: "bank.csv",
      headers: ["Data", "Kwota", "Odbiorca"],
    });
    expect(body.rows).toHaveLength(2);
  },

  "model was not called": async (_page: Page, captured: Captured) => {
    expect(captured.requests).toHaveLength(0);
  },
};

const run = interpreter(commands);

test.describe("AI fallback import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("unrecognized headers are sent to the model", async ({ page }) => {
    const captured: Captured = { requests: [] };
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["stub model and capture calls", page, captured],
      ["upload CSV with Polish headers", page],
      ["see review table", page],
      ["model received the headers and rows", page, captured],
    );
  });

  test("recognizable headers never leave the browser", async ({ page }) => {
    const captured: Captured = { requests: [] };
    await run(
      ["navigate to dashboard", page],
      ["open import panel", page],
      ["stub model and capture calls", page, captured],
      ["upload CSV with recognizable headers", page],
      ["see review table", page],
      ["model was not called", page, captured],
    );
  });
});
