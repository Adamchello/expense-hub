import { z } from "zod";

export const createProfileSchema = z.object({
  name: z
    .string({ required_error: "Profile name is required" })
    .trim()
    .min(1, "Profile name cannot be empty")
    .max(50, "Profile name must be 50 characters or less"),
});

export const renameProfileSchema = z.object({
  name: z
    .string({ required_error: "Profile name is required" })
    .trim()
    .min(1, "Profile name cannot be empty")
    .max(50, "Profile name must be 50 characters or less"),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type RenameProfileInput = z.infer<typeof renameProfileSchema>;
