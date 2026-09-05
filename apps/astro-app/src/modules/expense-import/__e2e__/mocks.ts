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

/** One row as the model returns it from /api/expenses/extract. */
export interface ExtractedRow {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: string;
}

export const buildExtractedRow = (
  overrides: Partial<ExtractedRow> = {},
): ExtractedRow => ({
  amount: 15.99,
  date: "2024-01-15",
  providerName: "Netflix",
  description: null,
  category: "Streaming",
  ...overrides,
});

export const extractedRows = (first: Partial<ExtractedRow> = {}) =>
  mock<ExtractedRow>([
    buildExtractedRow(first),
    buildExtractedRow({
      amount: 120,
      date: "2024-01-20",
      providerName: "Electric Company",
      description: "January bill",
      category: "Electricity",
    }),
  ]);

export const extractReply = (rows: ExtractedRow[], warnings: string[]) => ({
  code: 200,
  rows,
  warnings,
});

export const toCsv = (rows: ExpenseImportRow[]): string =>
  [
    CSV_HEADER.join(","),
    ...rows.map((row) => CSV_HEADER.map((key) => row[key]).join(",")),
  ].join("\n");
