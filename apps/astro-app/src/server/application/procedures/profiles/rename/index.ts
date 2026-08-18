import {
  Conflict,
  InternalServer,
  NotFound,
} from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { renameProfileContract } from "@/shared/server-contracts/schemas/profile";

export const renameProfile = privateProcedure({
  schema: withZodSchema({ schema: renameProfileContract }),
})({
  handler: async (input, { db, user }) => {
    const updateResult = await db
      .from("profiles")
      .update({ name: input.name, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("account_id", user.id)
      .select("id, name, created_at, updated_at")
      .maybeSingle();

    if (updateResult.error) {
      if (updateResult.error.code === "23505") {
        throw new Conflict("Profile name already exists");
      }
      console.error("Error renaming profile:", updateResult.error);
      throw new InternalServer("Failed to update profile");
    }

    if (!updateResult.data) {
      throw new NotFound("Profile not found");
    }

    return { code: 200 as const, data: updateResult.data };
  },
});
