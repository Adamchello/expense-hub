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

// Fallback style for expenses whose stored category predates the current taxonomy.
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

// ── Tinted-card treatment: full-card wash + colored label text ──────────────

export const DEFAULT_CATEGORY_WASH = "bg-gray-500/10 border-gray-500/25";

/** Card background/border wash per built-in category. */
export const CATEGORY_WASH: Record<Category, string> = {
  Rent: "bg-purple-500/10 border-purple-500/25",
  Electricity: "bg-yellow-500/10 border-yellow-500/25",
  Water: "bg-blue-500/10 border-blue-500/25",
  Internet: "bg-cyan-500/10 border-cyan-500/25",
  Groceries: "bg-green-500/10 border-green-500/25",
  Fuel: "bg-orange-500/10 border-orange-500/25",
  Insurance: "bg-indigo-500/10 border-indigo-500/25",
  Medical: "bg-red-500/10 border-red-500/25",
  Streaming: "bg-pink-500/10 border-pink-500/25",
  Dining: "bg-amber-500/10 border-amber-500/25",
  Entertainment: "bg-teal-500/10 border-teal-500/25",
  Uncategorized: DEFAULT_CATEGORY_WASH,
};

export const PRESET_COLOR_WASH: Record<string, string> = {
  gray: DEFAULT_CATEGORY_WASH,
  red: "bg-red-500/10 border-red-500/25",
  orange: "bg-orange-500/10 border-orange-500/25",
  amber: "bg-amber-500/10 border-amber-500/25",
  yellow: "bg-yellow-500/10 border-yellow-500/25",
  green: "bg-green-500/10 border-green-500/25",
  teal: "bg-teal-500/10 border-teal-500/25",
  cyan: "bg-cyan-500/10 border-cyan-500/25",
  blue: "bg-blue-500/10 border-blue-500/25",
  indigo: "bg-indigo-500/10 border-indigo-500/25",
  purple: "bg-purple-500/10 border-purple-500/25",
  pink: "bg-pink-500/10 border-pink-500/25",
};

export const DEFAULT_CATEGORY_TEXT = "text-gray-600 dark:text-gray-400";

/** Colored label text per built-in category. */
export const CATEGORY_TEXT: Record<Category, string> = {
  Rent: "text-purple-600 dark:text-purple-400",
  Electricity: "text-yellow-600 dark:text-yellow-400",
  Water: "text-blue-600 dark:text-blue-400",
  Internet: "text-cyan-600 dark:text-cyan-400",
  Groceries: "text-green-600 dark:text-green-400",
  Fuel: "text-orange-600 dark:text-orange-400",
  Insurance: "text-indigo-600 dark:text-indigo-400",
  Medical: "text-red-600 dark:text-red-400",
  Streaming: "text-pink-600 dark:text-pink-400",
  Dining: "text-amber-600 dark:text-amber-400",
  Entertainment: "text-teal-600 dark:text-teal-400",
  Uncategorized: DEFAULT_CATEGORY_TEXT,
};

export const PRESET_COLOR_TEXT: Record<string, string> = {
  gray: DEFAULT_CATEGORY_TEXT,
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  amber: "text-amber-600 dark:text-amber-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  green: "text-green-600 dark:text-green-400",
  teal: "text-teal-600 dark:text-teal-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  blue: "text-blue-600 dark:text-blue-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  purple: "text-purple-600 dark:text-purple-400",
  pink: "text-pink-600 dark:text-pink-400",
};

/** Badge classes for each custom-category color preset. */
export const PRESET_COLOR_CLASSES: Record<string, string> = {
  gray: DEFAULT_CATEGORY_COLOR,
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  orange:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  amber:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  yellow:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  green:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  indigo:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  purple:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

export const COLOR_PRESETS = Object.keys(PRESET_COLOR_CLASSES);

/** Solid hex per built-in category (Tailwind 500 steps) for SVG chart fills. */
export const CATEGORY_HEX: Record<Category, string> = {
  Rent: "#a855f7",
  Electricity: "#eab308",
  Water: "#3b82f6",
  Internet: "#06b6d4",
  Groceries: "#22c55e",
  Fuel: "#f97316",
  Insurance: "#6366f1",
  Medical: "#ef4444",
  Streaming: "#ec4899",
  Dining: "#f59e0b",
  Entertainment: "#14b8a6",
  Uncategorized: "#6b7280",
};

export const PRESET_COLOR_HEX: Record<string, string> = {
  gray: "#6b7280",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  green: "#22c55e",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
};
