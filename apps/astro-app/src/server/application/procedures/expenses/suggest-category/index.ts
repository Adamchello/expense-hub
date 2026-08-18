import { suggestCategory } from "@/modules/expense-management/core/category-suggestion";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { suggestCategoryContract } from "@/shared/server-contracts/schemas/expense";

export const suggestExpenseCategory = privateProcedure({
  schema: withZodSchema({ schema: suggestCategoryContract }),
})({
  handler: async (input) => {
    return {
      code: 200 as const,
      category: suggestCategory(input.providerName),
    };
  },
});
