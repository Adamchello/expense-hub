import { COLUMN_MAPPINGS } from "../../configuration/constraints";

export { COLUMN_MAPPINGS };

export function findColumnIndex(
  headers: string[],
  possibleNames: readonly string[],
): number {
  const normalizedHeaders = headers.map((h) =>
    h
      .toLowerCase()
      .trim()
      .replace(/[_\s-]/g, ""),
  );
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/[_\s-]/g, "");
    const index = normalizedHeaders.findIndex(
      (h) => h === normalizedName || h.includes(normalizedName),
    );
    if (index !== -1) return index;
  }
  return -1;
}

const NUMERIC_CELL = /^[\s($€£¥₹-]*\d[\d\s.,]*\)?$/;
const DATE_CELL = /^\s*\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\s*$/;

const looksLikeValue = (cell: string) =>
  NUMERIC_CELL.test(cell) || DATE_CELL.test(cell);

/**
 * A row is a header when it names a known column, or — for files in other
 * languages — when every cell is a non-empty label with no number or date in
 * it. Data rows always carry at least an amount or a date.
 */
export function hasHeaderRow(row: string[]): boolean {
  const allColumnNames = [
    ...COLUMN_MAPPINGS.amount,
    ...COLUMN_MAPPINGS.date,
    ...COLUMN_MAPPINGS.provider,
    ...COLUMN_MAPPINGS.description,
  ];
  const namesKnownColumn = row.some((cell) =>
    allColumnNames.some((name) => cell.toLowerCase().trim().includes(name)),
  );
  if (namesKnownColumn) return true;

  const cells = row.map((cell) => cell.trim());
  return (
    cells.length > 0 &&
    cells.every((cell) => cell !== "") &&
    !cells.some(looksLikeValue)
  );
}

export interface ColumnIndices {
  amount: number;
  date: number;
  provider: number;
  description: number;
}

export interface ColumnDetection {
  columns: ColumnIndices;
  /**
   * True only when a header row named every required column. Positional
   * guesses (no headers, or a required header missing) are not confident —
   * that is the signal to hand the file to the model instead.
   */
  confident: boolean;
}

export function detectColumns(
  headers: string[],
  hasHeaders: boolean,
): ColumnDetection {
  if (!hasHeaders) {
    return {
      columns: { amount: 0, date: 1, provider: 2, description: 3 },
      confident: false,
    };
  }

  const amountIdx = findColumnIndex(headers, COLUMN_MAPPINGS.amount);
  const dateIdx = findColumnIndex(headers, COLUMN_MAPPINGS.date);
  const providerIdx = findColumnIndex(headers, COLUMN_MAPPINGS.provider);
  const descriptionIdx = findColumnIndex(headers, COLUMN_MAPPINGS.description);

  const confident = amountIdx >= 0 && dateIdx >= 0 && providerIdx >= 0;

  return {
    columns: {
      amount: amountIdx >= 0 ? amountIdx : 0,
      date: dateIdx >= 0 ? dateIdx : 1,
      provider: providerIdx >= 0 ? providerIdx : 2,
      description: descriptionIdx,
    },
    confident,
  };
}
