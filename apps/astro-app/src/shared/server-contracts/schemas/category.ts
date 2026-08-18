import { z } from "zod";
import {
  badRequest,
  conflict,
  internalServer,
  notFound,
  unauthorized,
} from "../errors";
import type { ContractIn, ContractOut } from "../extraction";

export const CATEGORY_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const customCategoryInputSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(30, "Name must be 30 characters or less"),
  color: z.enum(CATEGORY_COLORS).default("gray"),
});

export const customCategoryRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  profile_id: z.string(),
  name: z.string(),
  color: z.string(),
  created_at: z.string(),
});

export const listCategoriesContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: z.array(customCategoryRowSchema),
      }),
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const createCategoryContract = () =>
  z.object({
    in: customCategoryInputSchema,
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(201),
        data: customCategoryRowSchema,
      }),
      badRequest,
      unauthorized,
      conflict,
      internalServer,
    ]),
  });

export const deleteCategoryContract = () =>
  z.object({
    in: z.object({
      id: z.string().uuid("Category id must be a valid uuid"),
    }),
    out: z.discriminatedUnion("code", [
      z.object({
        code: z.literal(200),
        data: customCategoryRowSchema,
      }),
      badRequest,
      unauthorized,
      notFound,
      internalServer,
    ]),
  });

export type ListCategoriesResult = ContractOut<
  typeof listCategoriesContract,
  200
>;
export type CreateCategoryInput = ContractIn<typeof createCategoryContract>;
export type CreateCategoryResult = ContractOut<
  typeof createCategoryContract,
  201
>;
export type DeleteCategoryResult = ContractOut<
  typeof deleteCategoryContract,
  200
>;
