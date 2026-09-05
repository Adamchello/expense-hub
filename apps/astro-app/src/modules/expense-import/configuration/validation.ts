import {
  MAX_FILE_SIZE,
  VALID_IMPORT_MIME_TYPES,
  VALID_IMPORT_EXTENSIONS,
} from "./constraints";

export function validateImportFileType(file: File): {
  valid: boolean;
  error?: string;
} {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (
    !VALID_IMPORT_MIME_TYPES.includes(file.type as any) &&
    !VALID_IMPORT_EXTENSIONS.includes(extension as any)
  ) {
    return {
      valid: false,
      error:
        "Unsupported file format. Please upload a CSV, XLS, XLSX, or PDF file.",
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
