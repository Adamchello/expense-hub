import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { listCategoriesContract } from "@/shared/server-contracts/schemas/category";

export const listCategories = profileProcedure({
  schema: withZodSchema({ schema: listCategoriesContract }),
})({
  handler: async (_input, { db, activeProfileId }) => {
    const listResult = await db
      .from("custom_categories")
      .select()
      .eq("profile_id", activeProfileId)
      .order("name", { ascending: true });

    if (listResult.error) {
      console.error("Error listing custom categories:", listResult.error);
      throw new InternalServer("Failed to load categories");
    }

    return { code: 200 as const, data: listResult.data ?? [] };
  },
});
