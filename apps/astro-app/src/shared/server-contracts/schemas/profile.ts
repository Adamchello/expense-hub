import { z } from "zod";
import {
  createProfileSchema,
  renameProfileSchema,
} from "@/shared/server-contracts/base/profile";
import {
  badRequest,
  conflict,
  internalServer,
  notFound,
  unauthorized,
} from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const profileRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const listProfilesContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.array(profileRowSchema),
      }),
      unauthorized,
      internalServer,
    ]),
  });

export const createProfileContract = () =>
  z.object({
    in: createProfileSchema,
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(201),
        data: profileRowSchema,
      }),
      badRequest,
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const renameProfileContract = () =>
  z.object({
    in: renameProfileSchema.extend({
      id: z.string().uuid("Profile id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: profileRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      conflict,
      internalServer,
    ]),
  });

export const deleteProfileContract = () =>
  z.object({
    in: z.object({
      id: z.string().uuid("Profile id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        deleted: z.literal(true),
      }),
      badRequest,
      unauthorized,
      notFound,
      conflict,
      internalServer,
    ]),
  });

export type ListProfilesResult = ContractOut<typeof listProfilesContract, 200>;
export type CreateProfileInput = ContractIn<typeof createProfileContract>;
export type CreateProfileResult = ContractOut<
  typeof createProfileContract,
  201
>;
export type RenameProfileInput = ContractIn<typeof renameProfileContract>;
export type RenameProfileResult = ContractOut<
  typeof renameProfileContract,
  200
>;
export type DeleteProfileResult = ContractOut<
  typeof deleteProfileContract,
  200
>;
