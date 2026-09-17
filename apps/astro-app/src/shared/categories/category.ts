export type Category =
  | "Rent"
  | "Electricity"
  | "Water"
  | "Internet"
  | "Groceries"
  | "Fuel"
  | "Insurance"
  | "Medical"
  | "Streaming"
  | "Dining"
  | "Entertainment"
  | "Uncategorized";

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
