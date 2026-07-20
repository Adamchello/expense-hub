import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Expense } from "../domain/expense";

const EXPORT_COLUMNS = [
  "Date",
  "Amount",
  "Category",
  "Provider",
  "Description",
];

const toExportRows = (expenses: Expense[]) =>
  expenses.map((expense) => ({
    Date: expense.date,
    Amount: expense.amount,
    Category: expense.category,
    Provider: expense.provider_name,
    Description: expense.description ?? "",
  }));

const exportFileName = (extension: string) =>
  `expenses-${new Date().toISOString().slice(0, 10)}.${extension}`;

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function exportExpensesToCsv(expenses: Expense[]) {
  const csv = Papa.unparse(toExportRows(expenses), { columns: EXPORT_COLUMNS });
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    exportFileName("csv"),
  );
}

export function exportExpensesToExcel(expenses: Expense[]) {
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(expenses), {
    header: EXPORT_COLUMNS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    exportFileName("xlsx"),
  );
}
