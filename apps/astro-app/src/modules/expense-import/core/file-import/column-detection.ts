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

export function hasHeaderRow(row: string[]): boolean {
  const allColumnNames = [
    ...COLUMN_MAPPINGS.amount,
    ...COLUMN_MAPPINGS.date,
    ...COLUMN_MAPPINGS.provider,
    ...COLUMN_MAPPINGS.description,
  ];
  return row.some((cell) =>
    allColumnNames.some((name) => cell.toLowerCase().trim().includes(name)),
  );
}

export interface ColumnIndices {
  amount: number;
  date: number;
  provider: number;
  description: number;
}

export function detectColumns(
  headers: string[],
  hasHeaders: boolean,
): ColumnIndices {
  if (!hasHeaders) {
    return { amount: 0, date: 1, provider: 2, description: 3 };
  }

  const amountIdx = findColumnIndex(headers, COLUMN_MAPPINGS.amount);
  const dateIdx = findColumnIndex(headers, COLUMN_MAPPINGS.date);
  const providerIdx = findColumnIndex(headers, COLUMN_MAPPINGS.provider);
  const descriptionIdx = findColumnIndex(headers, COLUMN_MAPPINGS.description);

  return {
    amount: amountIdx >= 0 ? amountIdx : 0,
    date: dateIdx >= 0 ? dateIdx : 1,
    provider: providerIdx >= 0 ? providerIdx : 2,
    description: descriptionIdx >= 0 ? descriptionIdx : 3,
  };
}
