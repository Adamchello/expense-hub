import { z } from "zod";

export const updateAccountSettingsSchema = z.object({
  activeProfileId: z
    .string({ required_error: "activeProfileId is required" })
    .uuid("activeProfileId must be a valid UUID"),
});

export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;
