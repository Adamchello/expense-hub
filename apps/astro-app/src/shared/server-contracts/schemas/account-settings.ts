import { z } from "zod";
import { updateAccountSettingsSchema } from "@/shared/server-contracts/base/account-settings";
import {
  badRequest,
  forbidden,
  internalServer,
  notFound,
  unauthorized,
} from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const accountSettingsRowSchema = z.object({
  account_id: z.string(),
  active_profile_id: z.string().nullable(),
  updated_at: z.string(),
});

export const getAccountSettingsContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: accountSettingsRowSchema,
      }),
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export const updateAccountSettingsContract = () =>
  z.object({
    in: updateAccountSettingsSchema,
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: accountSettingsRowSchema,
      }),
      badRequest,
      unauthorized,
      forbidden,
      internalServer,
    ]),
  });

export type AccountSettingsResult = ContractOut<
  typeof getAccountSettingsContract,
  200
>;
export type UpdateAccountSettingsInput = ContractIn<
  typeof updateAccountSettingsContract
>;
export type UpdateAccountSettingsResult = ContractOut<
  typeof updateAccountSettingsContract,
  200
>;
