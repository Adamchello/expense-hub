import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { importExpensesContract } from "@/shared/server-contracts/schemas/expense";

export const importExpenses = profileProcedure({
  schema: withZodSchema({ schema: importExpensesContract }),
})({
  handler: async (input, { db, user, activeProfileId }) => {
    const expensesToInsert = input.expenses.map((expense) => ({
      user_id: user.id,
      profile_id: activeProfileId,
      amount: expense.amount,
      date: expense.date,
      provider_name: expense.providerName,
      description: expense.description || null,
      category: expense.category,
      created_at: new Date().toISOString(),
    }));

    const insertResult = await db
      .from("expenses")
      .insert(expensesToInsert)
      .select();

    if (insertResult.error) {
      console.error("Error importing expenses:", insertResult.error);
      throw new InternalServer(
        "Failed to import expenses. No expenses were saved.",
      );
    }

    return { code: 201 as const, imported: insertResult.data?.length ?? 0 };
  },
});
