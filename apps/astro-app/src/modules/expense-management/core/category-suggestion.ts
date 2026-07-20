import type { Category } from "../domain/category";
import { CATEGORY_KEYWORDS } from "../configuration/constraints";

export function suggestCategory(providerName: string): Category {
  if (!providerName || !providerName.trim()) {
    return "Uncategorized";
  }

  const normalizedProvider = providerName.toLowerCase().trim();

  let maxScore = 0;
  let suggestedCategory: Category = "Uncategorized";

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedProvider.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      suggestedCategory = category as Category;
    }
  }

  return suggestedCategory;
}
