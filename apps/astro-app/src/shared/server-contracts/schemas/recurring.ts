import { z } from "zod";
import { recurringPaymentSchema } from "@/shared/server-contracts/base/recurring-payment";
import {
  badRequest,
  conflict,
  internalServer,
  notFound,
  unauthorized,
} from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const recurringPaymentRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  profile_id: z.string(),
  amount: z.number(),
  provider_name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  frequency: z.string(),
  next_due_date: z.string(),
  created_at: z.string(),
});

export const listRecurringContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.object({
          expenses: z.array(recurringPaymentRowSchema),
          materialized: z.number().int().nonnegative(),
        }),
      }),
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const createRecurringContract = () =>
  z.object({
    in: recurringPaymentSchema,
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(201),
        data: recurringPaymentRowSchema,
      }),
      badRequest,
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const updateRecurringContract = () =>
  z.object({
    in: recurringPaymentSchema.extend({
      id: z.string().uuid("Recurring payment id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: recurringPaymentRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export const deleteRecurringContract = () =>
  z.object({
    in: z.object({
      id: z.string().uuid("Recurring payment id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: recurringPaymentRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export type ListRecurringResult = ContractOut<
  typeof listRecurringContract,
  200
>;
export type CreateRecurringInput = ContractIn<typeof createRecurringContract>;
export type CreateRecurringResult = ContractOut<
  typeof createRecurringContract,
  201
>;
export type UpdateRecurringResult = ContractOut<
  typeof updateRecurringContract,
  200
>;
export type DeleteRecurringResult = ContractOut<
  typeof deleteRecurringContract,
  200
>;
