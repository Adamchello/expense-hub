import { CATEGORIES } from "@/shared/categories/configuration";
import { Conflict, InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { createCategoryContract } from "@/shared/server-contracts/schemas/category";

export const createCategory = profileProcedure({
  schema: withZodSchema({ schema: createCategoryContract }),
})({
  handler: async (input, { db, user, activeProfileId }) => {
    const isBuiltIn = CATEGORIES.some(
      (category) => category.toLowerCase() === input.name.toLowerCase(),
    );

    if (isBuiltIn) {
      throw new Conflict(`"${input.name}" is already a built-in category`);
    }

    const insertResult = await db
      .from("custom_categories")
      .insert({
        user_id: user.id,
        profile_id: activeProfileId,
        name: input.name,
        color: input.color,
      })
      .select()
      .single();

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        throw new Conflict(`Category "${input.name}" already exists`);
      }
      console.error("Error creating custom category:", insertResult.error);
      throw new InternalServer("Failed to create category");
    }

    return { code: 201 as const, data: insertResult.data };
  },
});
