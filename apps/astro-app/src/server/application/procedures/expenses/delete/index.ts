import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { deleteExpenseContract } from "@/shared/server-contracts/schemas/expense";

export const deleteExpense = privateProcedure({
  schema: withZodSchema({ schema: deleteExpenseContract }),
})({
  handler: async (input, { db, user }) => {
    const deleteResult = await db
      .from("expenses")
      .delete()
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (deleteResult.error) {
      console.error("Error deleting expense:", deleteResult.error);
      throw new InternalServer("Failed to delete expense");
    }

    if (!deleteResult.data) {
      throw new NotFound("Expense not found");
    }

    return { code: 200 as const, data: deleteResult.data };
  },
});
