import {
  CATEGORY_GROUPS,
  CATEGORIES,
  PRESET_COLOR_CLASSES,
  PRESET_COLOR_HEX,
  PRESET_COLOR_WASH,
  PRESET_COLOR_TEXT,
  CATEGORY_HEX,
  CATEGORY_WASH,
  CATEGORY_TEXT,
  DEFAULT_CATEGORY_WASH,
  DEFAULT_CATEGORY_TEXT,
  getCategoryColor,
} from "@/shared/configuration/category";
import type { Category } from "@/shared/domain/category";
import { useCustomCategories } from "./store";

export interface CategoryOptionGroup {
  label: string;
  categories: string[];
}

/**
 * Built-in taxonomy plus the active profile's custom categories, with badge
 * and chart color lookups that understand both.
 */
export function useCategoryOptions() {
  const query = useCustomCategories();
  const customs = query.data ?? [];

  const groups: CategoryOptionGroup[] = [
    ...CATEGORY_GROUPS.map((group) => ({
      label: group.label,
      categories: [...group.categories] as string[],
    })),
  ];
  if (customs.length > 0) {
    groups.push({
      label: "Custom",
      categories: customs.map((custom) => custom.name),
    });
  }

  const flat = [...CATEGORIES, ...customs.map((custom) => custom.name)];

  const badgeClassFor = (category: string): string => {
    const custom = customs.find((c) => c.name === category);
    if (custom) {
      return PRESET_COLOR_CLASSES[custom.color] ?? PRESET_COLOR_CLASSES.gray;
    }
    return getCategoryColor(category);
  };

  const hexFor = (category: string): string => {
    const custom = customs.find((c) => c.name === category);
    if (custom) return PRESET_COLOR_HEX[custom.color] ?? PRESET_COLOR_HEX.gray;
    return CATEGORY_HEX[category as Category] ?? PRESET_COLOR_HEX.gray;
  };

  /** Full-card background/border wash for the tinted card treatment. */
  const washClassFor = (category: string): string => {
    const custom = customs.find((c) => c.name === category);
    if (custom) return PRESET_COLOR_WASH[custom.color] ?? DEFAULT_CATEGORY_WASH;
    return CATEGORY_WASH[category as Category] ?? DEFAULT_CATEGORY_WASH;
  };

  const textClassFor = (category: string): string => {
    const custom = customs.find((c) => c.name === category);
    if (custom) return PRESET_COLOR_TEXT[custom.color] ?? DEFAULT_CATEGORY_TEXT;
    return CATEGORY_TEXT[category as Category] ?? DEFAULT_CATEGORY_TEXT;
  };

  return {
    groups,
    flat,
    customs,
    badgeClassFor,
    hexFor,
    washClassFor,
    textClassFor,
  };
}
