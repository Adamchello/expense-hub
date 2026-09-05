import { MAX_IMPORT_FILE_BYTES } from "@/shared/server-contracts/schemas/expense";

export const MAX_FILE_SIZE = MAX_IMPORT_FILE_BYTES;

export const VALID_IMPORT_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
] as const;

export const VALID_IMPORT_EXTENSIONS = [
  ".csv",
  ".xls",
  ".xlsx",
  ".pdf",
] as const;

export const COLUMN_MAPPINGS = {
  amount: ["amount", "amt", "total", "value", "price", "cost"],
  date: [
    "date",
    "expense_date",
    "expensedate",
    "payment_date",
    "paymentdate",
    "due_date",
    "duedate",
    // Legacy headers — real spreadsheets in the wild still carry these.
    "bill_date",
    "billdate",
  ],
  provider: [
    "provider",
    "provider_name",
    "providername",
    "vendor",
    "company",
    "merchant",
    "payee",
    "from",
    "name",
  ],
  description: [
    "description",
    "desc",
    "note",
    "notes",
    "memo",
    "details",
    "comment",
    "comments",
  ],
} as const;

export const DESCRIPTION_MAX_LENGTH = 100;
