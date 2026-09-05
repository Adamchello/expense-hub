export type { Category } from "@/shared/categories/category";
import type { Category } from "@/shared/categories/category";

export interface ParsedExpenseRow {
  id: string;
  amount: string;
  date: string;
  providerName: string;
  description: string;
  category: Category;
  errors: string[];
  isDuplicate: boolean;
  duplicateOf?: string;
}

export type ParseResult =
  | {
      success: true;
      rows: ParsedExpenseRow[];
      /** Non-blocking notes for the review step (e.g. what the model skipped). */
      warnings: string[];
    }
  | { success: false; errors: string[] };

/** A spreadsheet reduced to strings, before any column is interpreted. */
export interface SpreadsheetGrid {
  headers: string[];
  hasHeaders: boolean;
  rows: string[][];
}

export type GridResult =
  | { success: true; grid: SpreadsheetGrid }
  | { success: false; errors: string[] };

/** Which stage of file processing is running — drives the upload-step label. */
export type ProcessingPhase = "idle" | "parsing" | "extracting";
