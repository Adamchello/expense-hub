import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { deleteRecurringContract } from "@/shared/server-contracts/schemas/recurring";

export const deleteRecurringPayment = privateProcedure({
  schema: withZodSchema({ schema: deleteRecurringContract }),
})({
  handler: async (input, { db, user }) => {
    const deleteResult = await db
      .from("recurring_payments")
      .delete()
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (deleteResult.error) {
      console.error("Error deleting recurring payment:", deleteResult.error);
      throw new InternalServer("Failed to delete recurring payment");
    }

    if (!deleteResult.data) {
      throw new NotFound("Recurring payment not found");
    }

    return { code: 200 as const, data: deleteResult.data };
  },
});
