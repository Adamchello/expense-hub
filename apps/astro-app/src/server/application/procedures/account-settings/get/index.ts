import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { getAccountSettingsContract } from "@/shared/server-contracts/schemas/account-settings";

export const getAccountSettings = privateProcedure({
  schema: withZodSchema({ schema: getAccountSettingsContract }),
})({
  handler: async (_input, { db, user }) => {
    const settingsResult = await db
      .from("account_settings")
      .select("account_id, active_profile_id, updated_at")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsResult.error) {
      console.error("Error loading account settings:", settingsResult.error);
      throw new InternalServer("Failed to load account settings");
    }

    if (!settingsResult.data) {
      throw new NotFound("Account settings not found");
    }

    return { code: 200 as const, data: settingsResult.data };
  },
});
