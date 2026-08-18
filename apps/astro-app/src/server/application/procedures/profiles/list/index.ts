import { InternalServer } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { listProfilesContract } from "@/shared/server-contracts/schemas/profile";

export const listProfiles = privateProcedure({
  schema: withZodSchema({ schema: listProfilesContract }),
})({
  handler: async (_input, { db, user }) => {
    const listResult = await db
      .from("profiles")
      .select("id, name, created_at, updated_at")
      .eq("account_id", user.id)
      .order("created_at", { ascending: true });

    if (listResult.error) {
      console.error("Error loading profiles:", listResult.error);
      throw new InternalServer("Failed to load profiles");
    }

    return { code: 200 as const, data: listResult.data ?? [] };
  },
});
