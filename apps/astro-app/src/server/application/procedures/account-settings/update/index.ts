import { Forbidden, InternalServer } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { updateAccountSettingsContract } from "@/shared/server-contracts/schemas/account-settings";

export const updateAccountSettings = privateProcedure({
  schema: withZodSchema({ schema: updateAccountSettingsContract }),
})({
  handler: async (input, { db, user }) => {
    const ownerResult = await db
      .from("profiles")
      .select("id")
      .eq("id", input.activeProfileId)
      .eq("account_id", user.id)
      .maybeSingle();

    if (ownerResult.error) {
      console.error("Error verifying profile ownership:", ownerResult.error);
      throw new InternalServer("Failed to verify profile");
    }

    if (!ownerResult.data) {
      throw new Forbidden("Profile does not belong to this account");
    }

    const updateResult = await db
      .from("account_settings")
      .update({
        active_profile_id: input.activeProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", user.id)
      .select("account_id, active_profile_id, updated_at")
      .single();

    if (updateResult.error) {
      console.error("Error updating account settings:", updateResult.error);
      throw new InternalServer("Failed to update account settings");
    }

    return { code: 200 as const, data: updateResult.data };
  },
});
