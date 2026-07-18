export type { Category } from "@/shared/domain/category";
import type { Category } from "@/shared/domain/category";

export interface ParsedBillRow {
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

export interface ParseResult {
  success: boolean;
  rows: ParsedBillRow[];
  errors: string[];
}
