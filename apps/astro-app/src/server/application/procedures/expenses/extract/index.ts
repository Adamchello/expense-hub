import {
  BadRequest,
  InternalServer,
  TooManyRequests,
} from "../../../core/error-handling";
import { profileProcedure, type SupabaseServer } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import {
  LlmNotConfiguredError,
  LlmOutputTooLongError,
  LlmRefusedError,
} from "../../../adapter/llm";
import {
  EXTRACT_DAILY_LIMIT,
  extractExpensesContract,
} from "@/shared/server-contracts/schemas/expense";
import { CATEGORIES } from "@/shared/categories/configuration";
import { extractExpensesWith } from "./extraction";

/** Atomic "take one from today's allowance"; -1 means none left. */
const consumeQuota = async (db: SupabaseServer) => {
  const result = await db.rpc("consume_extraction_quota", {
    p_limit: EXTRACT_DAILY_LIMIT,
  });

  if (result.error) {
    console.error("Error consuming extraction quota:", result.error);
    throw new InternalServer("Could not start file extraction.");
  }

  if (result.data === -1) {
    throw new TooManyRequests(
      `You have used today's ${EXTRACT_DAILY_LIMIT} AI file reads. Try again tomorrow.`,
    );
  }
};

const loadCategories = async (
  db: SupabaseServer,
  profileId: string,
): Promise<string[]> => {
  const result = await db
    .from("custom_categories")
    .select("name")
    .eq("profile_id", profileId);

  if (result.error) {
    console.error("Error loading custom categories:", result.error);
    throw new InternalServer("Could not start file extraction.");
  }

  const customs = (result.data ?? []).map((row) => row.name);
  return [...CATEGORIES, ...customs];
};

const toUserError = (error: unknown) => {
  if (error instanceof LlmOutputTooLongError) {
    return new BadRequest(
      "This file is too long to read in one go. Split it and try again.",
    );
  }
  if (error instanceof LlmRefusedError) {
    return new InternalServer("The model declined to read this file.");
  }
  if (error instanceof LlmNotConfiguredError) {
    return new InternalServer("File extraction is not available.");
  }
  return new InternalServer("Could not read expenses from this file.");
};

export const extractExpenses = profileProcedure({
  schema: withZodSchema({ schema: extractExpensesContract }),
})({
  handler: async (input, { db, activeProfileId }) => {
    await consumeQuota(db);
    const categories = await loadCategories(db, activeProfileId);

    try {
      const result = await extractExpensesWith(input, categories);
      return { code: 200 as const, ...result };
    } catch (error) {
      console.error("Error extracting expenses:", error);
      throw toUserError(error);
    }
  },
});
