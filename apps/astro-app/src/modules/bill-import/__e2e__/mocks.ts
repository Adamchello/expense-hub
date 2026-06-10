import { mock } from "@/__e2e__/mock";

export interface BillImportRow {
  amount: string;
  date: string;
  provider: string;
  description: string;
}

const CSV_HEADER: ReadonlyArray<keyof BillImportRow> = [
  "amount",
  "date",
  "provider",
  "description",
];

export const buildBillRow = (
  overrides: Partial<BillImportRow> = {},
): BillImportRow => ({
  amount: "125.50",
  date: "2024-01-15",
  provider: "Electric Company",
  description: "Monthly bill",
  ...overrides,
});

export const billRows = (first: Partial<BillImportRow> = {}) =>
  mock<BillImportRow>([buildBillRow(first)]);

export const toCsv = (rows: BillImportRow[]): string =>
  [
    CSV_HEADER.join(","),
    ...rows.map((row) => CSV_HEADER.map((key) => row[key]).join(",")),
  ].join("\n");
