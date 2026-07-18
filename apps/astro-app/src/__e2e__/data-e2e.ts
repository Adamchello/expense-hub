import type { Locator, Page } from "@playwright/test";
import { BILL_IMPORT_E2E } from "@/modules/bill-import/__e2e__/selectors";
import { RECURRING_BILLS_E2E } from "@/modules/recurring-bills/__e2e__/selectors";

const ALL_E2E = [...BILL_IMPORT_E2E, ...RECURRING_BILLS_E2E] as const;

export type DataE2E = (typeof ALL_E2E)[number];

export const getById = (scope: Page | Locator, id: DataE2E): Locator =>
  scope.locator(`[data-e2e="${id}"]`);
