import Papa from "papaparse";
import type { GridResult } from "../../domain/expense-import";
import { hasHeaderRow } from "../../core/file-import/column-detection";

const isBlank = (row: string[]) => row.every((cell) => cell.trim() === "");

export async function readCsvGrid(file: File): Promise<GridResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = (results.data as string[][]).filter(
          (row) => !isBlank(row),
        );

        if (data.length < 2) {
          resolve({
            success: false,
            errors: ["File appears to be empty or has no data rows."],
          });
          return;
        }

        const firstRow = data[0];
        const hasHeaders = hasHeaderRow(firstRow);

        resolve({
          success: true,
          grid: {
            headers: hasHeaders ? firstRow : [],
            hasHeaders,
            rows: hasHeaders ? data.slice(1) : data,
          },
        });
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [`Failed to parse CSV: ${error.message}`],
        });
      },
      skipEmptyLines: true,
    });
  });
}
