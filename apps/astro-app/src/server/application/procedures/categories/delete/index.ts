import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { deleteCategoryContract } from "@/shared/server-contracts/schemas/category";

export const deleteCategory = privateProcedure({
  schema: withZodSchema({ schema: deleteCategoryContract }),
})({
  handler: async (input, { db, user }) => {
    const deleteResult = await db
      .from("custom_categories")
      .delete()
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (deleteResult.error) {
      console.error("Error deleting custom category:", deleteResult.error);
      throw new InternalServer("Failed to delete category");
    }

    if (!deleteResult.data) {
      throw new NotFound("Category not found");
    }

    return { code: 200 as const, data: deleteResult.data };
  },
});
