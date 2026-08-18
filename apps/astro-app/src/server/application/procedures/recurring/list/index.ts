import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { listRecurringContract } from "@/shared/server-contracts/schemas/recurring";

export const listRecurringPayments = profileProcedure({
  schema: withZodSchema({ schema: listRecurringContract }),
})({
  handler: async (_input, { db, activeProfileId }) => {
    // Subscription semantics: due occurrences are turned into real expenses
    // lazily on list. One RPC call, one transaction — all-or-nothing.
    const materializeResult = await db.rpc(
      "materialize_due_recurring_expenses",
      { p_profile_id: activeProfileId },
    );

    if (materializeResult.error) {
      console.error(
        "Error materializing due expenses:",
        materializeResult.error,
      );
      throw new InternalServer("Failed to process due recurring payments");
    }

    const listResult = await db
      .from("recurring_payments")
      .select()
      .eq("profile_id", activeProfileId)
      .order("next_due_date", { ascending: true });

    if (listResult.error) {
      console.error("Error listing recurring payments:", listResult.error);
      throw new InternalServer("Failed to load recurring payments");
    }

    return {
      code: 200 as const,
      data: {
        expenses: listResult.data ?? [],
        materialized: materializeResult.data ?? 0,
      },
    };
  },
});
