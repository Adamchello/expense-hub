import { InternalServer, NotFound } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { updateRecurringContract } from "@/shared/server-contracts/schemas/recurring";

export const updateRecurringPayment = privateProcedure({
  schema: withZodSchema({ schema: updateRecurringContract }),
})({
  handler: async (input, { db, user }) => {
    const updateResult = await db
      .from("recurring_payments")
      .update({
        amount: input.amount,
        provider_name: input.providerName,
        description: input.description || null,
        category: input.category,
        frequency: input.frequency,
        next_due_date: input.nextDueDate,
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (updateResult.error) {
      console.error("Error updating recurring payment:", updateResult.error);
      throw new InternalServer("Failed to update recurring payment");
    }

    if (!updateResult.data) {
      throw new NotFound("Recurring payment not found");
    }

    return { code: 200 as const, data: updateResult.data };
  },
});
