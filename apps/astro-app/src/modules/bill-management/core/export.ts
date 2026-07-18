import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Bill } from "../domain/bill";

const EXPORT_COLUMNS = [
  "Date",
  "Amount",
  "Category",
  "Provider",
  "Description",
];

const toExportRows = (bills: Bill[]) =>
  bills.map((bill) => ({
    Date: bill.date,
    Amount: bill.amount,
    Category: bill.category,
    Provider: bill.provider_name,
    Description: bill.description ?? "",
  }));

const exportFileName = (extension: string) =>
  `bills-${new Date().toISOString().slice(0, 10)}.${extension}`;

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function exportBillsToCsv(bills: Bill[]) {
  const csv = Papa.unparse(toExportRows(bills), { columns: EXPORT_COLUMNS });
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    exportFileName("csv"),
  );
}

export function exportBillsToExcel(bills: Bill[]) {
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(bills), {
    header: EXPORT_COLUMNS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    exportFileName("xlsx"),
  );
}
