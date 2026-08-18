import { z } from "zod";
import { badRequest, internalServer, unauthorized } from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const renameMerchantContract = () =>
  z.object({
    in: z
      .object({
        from: z.string().trim().min(1, "Current merchant name is required"),
        to: z.string().trim().min(1, "New merchant name is required"),
      })
      .refine((input) => input.from !== input.to, {
        message: "New name must differ from the current name",
      }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.object({
          expenses_updated: z.number().int().nonnegative(),
          recurring_updated: z.number().int().nonnegative(),
        }),
      }),
      badRequest,
      unauthorized,
      internalServer,
    ]),
  });

export type RenameMerchantInput = ContractIn<typeof renameMerchantContract>;
export type RenameMerchantResult = ContractOut<
  typeof renameMerchantContract,
  200
>;
