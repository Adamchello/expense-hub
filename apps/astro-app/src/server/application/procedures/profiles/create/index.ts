import { Conflict, InternalServer } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { createProfileContract } from "@/shared/server-contracts/schemas/profile";

const MAX_PROFILES = 10;

export const createProfile = privateProcedure({
  schema: withZodSchema({ schema: createProfileContract }),
})({
  handler: async (input, { db, user }) => {
    const countResult = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_id", user.id);

    if (countResult.error) {
      console.error("Error counting profiles:", countResult.error);
      throw new InternalServer("Failed to verify profile limit");
    }

    if ((countResult.count ?? 0) >= MAX_PROFILES) {
      throw new Conflict(`Profile limit reached (max ${MAX_PROFILES})`);
    }

    const insertResult = await db
      .from("profiles")
      .insert({ account_id: user.id, name: input.name })
      .select("id, name, created_at, updated_at")
      .single();

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        throw new Conflict("Profile name already exists");
      }
      console.error("Error creating profile:", insertResult.error);
      throw new InternalServer("Failed to create profile");
    }

    return { code: 201 as const, data: insertResult.data };
  },
});
