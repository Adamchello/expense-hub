import type { Category } from "./category";
import type { Expense } from "./expense";

export type ExpenseManagementEvent =
  | { type: "ExpenseCreated"; expense: Expense }
  | { type: "CategorySuggested"; providerName: string; category: Category };
