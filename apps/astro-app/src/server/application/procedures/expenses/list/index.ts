import { InternalServer } from "../../../core/error-handling";
import { profileProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { listExpensesContract } from "@/shared/server-contracts/schemas/expense";

export const listExpenses = profileProcedure({
  schema: withZodSchema({ schema: listExpensesContract }),
})({
  handler: async (_input, { db, user, activeProfileId }) => {
    const listResult = await db
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("profile_id", activeProfileId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (listResult.error) {
      console.error("Error fetching expenses:", listResult.error);
      throw new InternalServer("Failed to fetch expenses");
    }

    return { code: 200 as const, data: listResult.data ?? [] };
  },
});
