import * as XLSX from "xlsx";
import type { ParseResult } from "../../domain/expense-import";
import {
  hasHeaderRow,
  detectColumns,
} from "../../core/file-import/column-detection";
import { parseRow } from "../../core/file-import/row-parser";

export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            rows: [],
            errors: ["Excel file contains no worksheets."],
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as unknown[][];

        if (jsonData.length < 2) {
          resolve({
            success: false,
            rows: [],
            errors: ["File appears to be empty or has no data rows."],
          });
          return;
        }

        const firstRow = jsonData[0].map((cell) => String(cell || ""));
        const hasHeaders = hasHeaderRow(firstRow);

        const headers = hasHeaders
          ? firstRow
          : ["amount", "date", "provider", "description"];
        const dataRows = hasHeaders
          ? jsonData
              .slice(1)
              .map((row) => row.map((cell) => String(cell || "")))
              .filter((row) => row.some((cell) => cell.trim() !== ""))
          : jsonData
              .map((row) => row.map((cell) => String(cell || "")))
              .filter((row) => row.some((cell) => cell.trim() !== ""));

        if (!hasHeaders && jsonData[0].length < 3) {
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
      } catch (error) {
        resolve({
          success: false,
          rows: [],
          errors: [
            `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        rows: [],
        errors: ["Failed to read file. Please try again."],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
