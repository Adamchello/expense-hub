export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const VALID_SPREADSHEET_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const VALID_SPREADSHEET_EXTENSIONS = [".csv", ".xls", ".xlsx"] as const;

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
