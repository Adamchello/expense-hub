import type { Locator, Page } from "@playwright/test";
import { EXPENSE_IMPORT_E2E } from "@/modules/expense-import/__e2e__/selectors";
import { RECURRING_PAYMENTS_E2E } from "@/modules/recurring-payments/__e2e__/selectors";

const ALL_E2E = [...EXPENSE_IMPORT_E2E, ...RECURRING_PAYMENTS_E2E] as const;

export type DataE2E = (typeof ALL_E2E)[number];

export const getById = (scope: Page | Locator, id: DataE2E): Locator =>
  scope.locator(`[data-e2e="${id}"]`);
