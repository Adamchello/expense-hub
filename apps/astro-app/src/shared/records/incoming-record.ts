import type { Category } from "@/shared/categories/category";
import type { DataE2E } from "@/__e2e__/data-e2e";

/**
 * A record that has not happened yet, shaped for a list of records.
 *
 * Lives beside `RecordCard` rather than inside any feature module: the history
 * register renders it without knowing what a recurring payment is, and the
 * recurring-payments side maps itself into it without knowing what a history
 * register is. Neither module imports the other.
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
