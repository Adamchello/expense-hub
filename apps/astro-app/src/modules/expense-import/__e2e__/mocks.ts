import { mock } from "@/__e2e__/mock";

export interface ExpenseImportRow {
  amount: string;
  date: string;
  provider: string;
  description: string;
}

const CSV_HEADER: ReadonlyArray<keyof ExpenseImportRow> = [
  "amount",
  "date",
  "provider",
  "description",
];

export const buildExpenseRow = (
  overrides: Partial<ExpenseImportRow> = {},
): ExpenseImportRow => ({
  amount: "125.50",
  date: "2024-01-15",
  provider: "Electric Company",
  description: "Monthly expense",
  ...overrides,
});

export const expenseRows = (first: Partial<ExpenseImportRow> = {}) =>
  mock<ExpenseImportRow>([buildExpenseRow(first)]);

export const toCsv = (rows: ExpenseImportRow[]): string =>
  [
    CSV_HEADER.join(","),
    ...rows.map((row) => CSV_HEADER.map((key) => row[key]).join(",")),
  ].join("\n");
