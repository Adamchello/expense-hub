import { InternalServer } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { bulkDeleteExpensesContract } from "@/shared/server-contracts/schemas/expense";

export const bulkDeleteExpenses = privateProcedure({
  schema: withZodSchema({ schema: bulkDeleteExpensesContract }),
})({
  handler: async (input, { db, user }) => {
    const deleteResult = await db
      .from("expenses")
      .delete()
      .in("id", input.ids)
      .eq("user_id", user.id)
      .select("id");

    if (deleteResult.error) {
      console.error("Error bulk-deleting expenses:", deleteResult.error);
      throw new InternalServer("Failed to delete expenses");
    }

    return {
      code: 200 as const,
      data: { deleted: deleteResult.data?.length ?? 0 },
    };
  },
});
