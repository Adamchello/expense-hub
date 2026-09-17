import type { Category } from "@/shared/categories/category";
import type { DataE2E } from "@/__e2e__/data-e2e";

/**
 * A record that has not happened yet, shaped for a list of records.
 *
 * Shared because two modules meet on it: expense-management renders it
 * (`RecordCard`, `ExpenseHistory`) and history maps recurring payments into it.
 * Neither side learns the other's domain.
 */
export interface IncomingRecord {
  id: string;
  name: string;
  amount: number;
  category: Category;
  description: string | null;
  /** Due date (YYYY-MM-DD) — filtered and sorted with the expense dates. */
  date: string;
  /** Trails the category chip, e.g. "· Monthly". */
  categorySuffix?: string;
  meta: string;
  metaTestId?: DataE2E;
  openLabel: string;
  onOpen: () => void;
}
