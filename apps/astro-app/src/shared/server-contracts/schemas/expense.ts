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
  tooManyRequests,
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

/** Largest file the import accepts, enforced on both sides. */
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
/** Base64 grows by 4/3 plus padding; anything longer is not a 10 MB file. */
export const EXTRACT_PDF_BASE64_MAX_LENGTH =
  Math.ceil(MAX_IMPORT_FILE_BYTES / 3) * 4;
/** Upper bound on spreadsheet rows sent to the model in one request. */
export const EXTRACT_ROWS_CAP = 500;
/** Model-backed extractions one account may run per calendar day (UTC). */
export const EXTRACT_DAILY_LIMIT = 20;

/**
 * Shape the model must return. Also drives the JSON schema sent to the model
 * and the 200 response, so there is exactly one definition of it.
 * `category` is a free string here; the per-request JSON schema narrows it to
 * the user's own category list.
 */
export const extractionResultSchema = z.object({
  rows: z.array(
    z.object({
      amount: z.number(),
      date: z.string(),
      providerName: z.string(),
      description: z.string().nullable(),
      category: z.string(),
    }),
  ),
  warnings: z.array(z.string()),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export const extractExpensesContract = () =>
  z.object({
    in: z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("pdf"),
        fileName: z.string().min(1),
        base64: z
          .string()
          .min(1)
          .max(EXTRACT_PDF_BASE64_MAX_LENGTH, "File exceeds the 10 MB limit"),
      }),
      z.object({
        kind: z.literal("rows"),
        fileName: z.string().min(1),
        headers: z.array(z.string()),
        rows: z
          .array(z.array(z.string()))
          .min(1, "At least one row is required")
          .max(
            EXTRACT_ROWS_CAP,
            `At most ${EXTRACT_ROWS_CAP} rows per request`,
          ),
      }),
    ]),
    out: z.discriminatedUnion("code", [
      extractionResultSchema.extend({ code: z.literal(200) }),
      badRequest,
      unauthorized,
      conflict,
      tooManyRequests,
      internalServer,
    ]),
  });

export type ExtractExpensesInput = ContractIn<typeof extractExpensesContract>;
export type ExtractExpensesResult = ContractOut<
  typeof extractExpensesContract,
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
