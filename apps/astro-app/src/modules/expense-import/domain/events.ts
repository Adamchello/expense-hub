import type { ParsedExpenseRow } from "./expense-import";

export type ExpenseImportEvent =
  | { type: "FileSelected"; fileName: string }
  | { type: "ParseStarted" }
  | { type: "ParseSucceeded"; rows: ParsedExpenseRow[] }
  | { type: "ParseFailed"; errors: string[] }
  | { type: "RowUpdated"; rowId: string }
  | { type: "RowRemoved"; rowId: string }
  | { type: "ImportConfirmed"; validRowCount: number }
  | { type: "ImportSucceeded"; importedCount: number }
  | { type: "ImportFailed"; error: string };
