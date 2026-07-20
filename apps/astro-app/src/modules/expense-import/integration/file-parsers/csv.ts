import Papa from "papaparse";
import type { ParseResult } from "../../domain/expense-import";
import {
  hasHeaderRow,
  detectColumns,
} from "../../core/file-import/column-detection";
import { parseRow } from "../../core/file-import/row-parser";

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];

        if (data.length < 2) {
          resolve({
            success: false,
            rows: [],
            errors: ["File appears to be empty or has no data rows."],
          });
          return;
        }

        const firstRow = data[0];
        const hasHeaders = hasHeaderRow(firstRow);

        const headers = hasHeaders
          ? firstRow
          : ["amount", "date", "provider", "description"];
        const dataRows = hasHeaders
          ? data
              .slice(1)
              .filter((row) => row.some((cell) => cell.trim() !== ""))
          : data.filter((row) => row.some((cell) => cell.trim() !== ""));

        if (!hasHeaders && data[0].length < 3) {
          resolve({
            success: false,
            rows: [],
            errors: [
              "Could not identify required columns (amount, date, provider). Please use the template format.",
            ],
          });
          return;
        }

        const columns = detectColumns(headers, hasHeaders);
        const parsedRows = dataRows.map((row) => parseRow(row, columns));

        resolve({ success: true, rows: parsedRows, errors: [] });
      },
      error: (error) => {
        resolve({
          success: false,
          rows: [],
          errors: [`Failed to parse CSV: ${error.message}`],
        });
      },
      skipEmptyLines: true,
    });
  });
}
