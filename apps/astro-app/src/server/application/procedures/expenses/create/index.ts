import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { createExpenseContract } from "@/shared/server-contracts/schemas/expense";

export const createExpense = profileProcedure({
  schema: withZodSchema({ schema: createExpenseContract }),
})({
  handler: async (input, { db, user, activeProfileId }) => {
    const insertResult = await db
      .from("expenses")
      .insert({
        user_id: user.id,
        profile_id: activeProfileId,
        amount: input.amount,
        date: input.date,
        provider_name: input.providerName,
        description: input.description || null,
        category: input.category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertResult.error) {
      console.error("Error creating expense:", insertResult.error);
      throw new InternalServer("Failed to save expense");
    }

    return { code: 201 as const, data: insertResult.data };
  },
});
