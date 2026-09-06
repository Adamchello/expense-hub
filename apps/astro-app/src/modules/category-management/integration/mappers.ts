import {
  customCategoryInputSchema,
  type CreateCategoryInput,
} from "@/shared/server-contracts/schemas/category";
import type { CustomCategory } from "../domain/custom-category";

/**
 * The domain row a submission will become once the server accepts it.
 * Runs the same schema the server does, so trimming and the default colour
 * are decided once, in the contract, not copied here.
 */
export const customCategoryFromInput = (
  input: CreateCategoryInput,
): Omit<CustomCategory, "id" | "created_at"> => {
  const clean = customCategoryInputSchema.parse(input);
  return { name: clean.name, color: clean.color };
};
