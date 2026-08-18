import { z } from "zod";
import { expenseSchema } from "@/shared/server-contracts/base/expense";

export const expenseRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  profile_id: z.string(),
  amount: z.number(),
  date: z.string(),
  provider_name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  created_at: z.string(),
});

import {
  badRequest,
  conflict,
  internalServer,
  notFound,
  unauthorized,
} from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const createExpenseContract = () =>
  z.object({
    in: expenseSchema,
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(201),
        data: expenseRowSchema,
      }),
      badRequest,
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const listExpensesContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.array(expenseRowSchema),
      }),
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const updateExpenseContract = () =>
  z.object({
    in: expenseSchema.extend({
      id: z.string().uuid("Expense id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: expenseRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export const deleteExpenseContract = () =>
  z.object({
    in: z.object({
      id: z.string().uuid("Expense id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: expenseRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export const importExpensesContract = () =>
  z.object({
    in: z.object({
      expenses: z
        .array(expenseSchema)
        .min(1, "At least one expense is required"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(201),
        imported: z.number().int().nonnegative(),
      }),
      badRequest,
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const suggestCategoryContract = () =>
  z.object({
    in: z.object({
      providerName: z
        .string({ required_error: "Provider name is required" })
        .min(1, "Provider name is required"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        category: z.string(),
      }),
      badRequest,
      unauthorized,
      internalServer,
    ]),
  });

export type CreateExpenseInput = ContractIn<typeof createExpenseContract>;
export type CreateExpenseResult = ContractOut<
  typeof createExpenseContract,
  201
>;
export type ListExpensesResult = ContractOut<typeof listExpensesContract, 200>;
export type UpdateExpenseInput = ContractIn<typeof updateExpenseContract>;
export type UpdateExpenseResult = ContractOut<
  typeof updateExpenseContract,
  200
>;
export type DeleteExpenseResult = ContractOut<
  typeof deleteExpenseContract,
  200
>;
export type ImportExpensesInput = ContractIn<typeof importExpensesContract>;
export type ImportExpensesResult = ContractOut<
  typeof importExpensesContract,
  201
>;
export type SuggestCategoryResult = ContractOut<
  typeof suggestCategoryContract,
  200
>;

export const bulkDeleteExpensesContract = () =>
  z.object({
    in: z.object({
      ids: z
        .array(z.string().uuid())
        .min(1, "At least one expense id is required")
        .max(500),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.object({ deleted: z.number() }),
      }),
      badRequest,
      unauthorized,
      internalServer,
    ]),
  });

export type BulkDeleteExpensesInput = ContractIn<
  typeof bulkDeleteExpensesContract
>;
export type BulkDeleteExpensesResult = ContractOut<
  typeof bulkDeleteExpensesContract
>;
