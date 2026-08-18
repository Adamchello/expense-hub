import {
  Conflict,
  InternalServer,
  NotFound,
} from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { deleteProfileContract } from "@/shared/server-contracts/schemas/profile";

export const deleteProfile = privateProcedure({
  schema: withZodSchema({ schema: deleteProfileContract }),
})({
  handler: async (input, { db, user }) => {
    const listResult = await db
      .from("profiles")
      .select("id, created_at")
      .eq("account_id", user.id)
      .order("created_at", { ascending: true });

    if (listResult.error) {
      console.error("Error loading profiles:", listResult.error);
      throw new InternalServer("Failed to load profiles");
    }

    const profiles = listResult.data ?? [];
    const target = profiles.find((profile) => profile.id === input.id);

    if (!target) {
      throw new NotFound("Profile not found");
    }

    if (profiles.length <= 1) {
      throw new Conflict("Cannot delete the last remaining profile");
    }

    const settingsResult = await db
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsResult.data?.active_profile_id === input.id) {
      const nextProfile = profiles.find((profile) => profile.id !== input.id);
      if (nextProfile) {
        const switchResult = await db
          .from("account_settings")
          .update({
            active_profile_id: nextProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq("account_id", user.id);

        if (switchResult.error) {
          console.error(
            "Error reassigning active profile:",
            switchResult.error,
          );
          throw new InternalServer("Failed to reassign active profile");
        }
      }
    }

    const deleteResult = await db
      .from("profiles")
      .delete()
      .eq("id", input.id)
      .eq("account_id", user.id);

    if (deleteResult.error) {
      console.error("Error deleting profile:", deleteResult.error);
      throw new InternalServer("Failed to delete profile");
    }

    return { code: 200 as const, deleted: true as const };
  },
});
