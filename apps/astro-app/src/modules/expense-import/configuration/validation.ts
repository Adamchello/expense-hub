import {
  MAX_FILE_SIZE,
  VALID_SPREADSHEET_MIME_TYPES,
  VALID_SPREADSHEET_EXTENSIONS,
} from "./constraints";

export function validateSpreadsheetType(file: File): {
  valid: boolean;
  error?: string;
} {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (
    !VALID_SPREADSHEET_MIME_TYPES.includes(file.type as any) &&
    !VALID_SPREADSHEET_EXTENSIONS.includes(extension as any)
  ) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload a CSV, XLS, or XLSX file.",
    };
  }

  return { valid: true };
}

export function validateFileSize(
  file: File,
  maxSize = MAX_FILE_SIZE,
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB} MB limit. Please split your data into smaller files.`,
    };
  }
  return { valid: true };
}
