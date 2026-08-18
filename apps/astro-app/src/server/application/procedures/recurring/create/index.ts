import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { createRecurringContract } from "@/shared/server-contracts/schemas/recurring";

export const createRecurringPayment = profileProcedure({
  schema: withZodSchema({ schema: createRecurringContract }),
})({
  handler: async (input, { db, user, activeProfileId }) => {
    const insertResult = await db
      .from("recurring_payments")
      .insert({
        user_id: user.id,
        profile_id: activeProfileId,
        amount: input.amount,
        provider_name: input.providerName,
        description: input.description || null,
        category: input.category,
        frequency: input.frequency,
        next_due_date: input.nextDueDate,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertResult.error) {
      console.error("Error creating recurring payment:", insertResult.error);
      throw new InternalServer("Failed to save recurring payment");
    }

    return { code: 201 as const, data: insertResult.data };
  },
});
