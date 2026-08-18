import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { updateExpenseContract } from "@/shared/server-contracts/schemas/expense";

export const updateExpense = privateProcedure({
  schema: withZodSchema({ schema: updateExpenseContract }),
})({
  handler: async (input, { db, user }) => {
    const updateResult = await db
      .from("expenses")
      .update({
        amount: input.amount,
        date: input.date,
        provider_name: input.providerName,
        description: input.description || null,
        category: input.category,
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (updateResult.error) {
      console.error("Error updating expense:", updateResult.error);
      throw new InternalServer("Failed to update expense");
    }

    if (!updateResult.data) {
      throw new NotFound("Expense not found");
    }

    return { code: 200 as const, data: updateResult.data };
  },
});
