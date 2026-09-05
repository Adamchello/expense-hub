import * as XLSX from "xlsx";
import type { GridResult } from "../../domain/expense-import";
import { hasHeaderRow } from "../../core/file-import/column-detection";

const toStrings = (row: unknown[]) => row.map((cell) => String(cell ?? ""));
const isBlank = (row: string[]) => row.every((cell) => cell.trim() === "");

export async function readExcelGrid(file: File): Promise<GridResult> {
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
            errors: ["Excel file contains no worksheets."],
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = (
          XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
        )
          .map(toStrings)
          .filter((row) => !isBlank(row));

        if (jsonData.length < 2) {
          resolve({
            success: false,
            errors: ["File appears to be empty or has no data rows."],
          });
          return;
        }

        const firstRow = jsonData[0];
        const hasHeaders = hasHeaderRow(firstRow);

        resolve({
          success: true,
          grid: {
            headers: hasHeaders ? firstRow : [],
            hasHeaders,
            rows: hasHeaders ? jsonData.slice(1) : jsonData,
          },
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [
            `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ["Failed to read file. Please try again."],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
