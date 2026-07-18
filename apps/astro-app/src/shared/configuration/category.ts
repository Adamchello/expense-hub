import type { Category } from "../domain/category";

export const CATEGORY_GROUPS: { label: string; categories: Category[] }[] = [
  { label: "Home", categories: ["Rent", "Electricity", "Water", "Internet"] },
  { label: "Everyday", categories: ["Groceries", "Fuel"] },
  { label: "Health & Finance", categories: ["Insurance", "Medical"] },
  { label: "Leisure", categories: ["Streaming", "Dining", "Entertainment"] },
  { label: "Other", categories: ["Uncategorized"] },
];

export const CATEGORIES: Category[] = CATEGORY_GROUPS.flatMap(
  (group) => group.categories,
);

// Fallback style for bills whose stored category predates the current taxonomy.
export const DEFAULT_CATEGORY_COLOR =
  "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";

export const CATEGORY_COLORS: Record<Category, string> = {
  Rent: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Electricity:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  Water: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Internet:
    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  Groceries:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Fuel: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Insurance:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  Medical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  Streaming:
    "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  Dining:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Entertainment:
    "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Uncategorized: DEFAULT_CATEGORY_COLOR,
};

export const getCategoryColor = (category: string): string =>
  CATEGORY_COLORS[category as Category] ?? DEFAULT_CATEGORY_COLOR;
