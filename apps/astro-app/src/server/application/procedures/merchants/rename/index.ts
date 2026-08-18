import { InternalServer } from "../../../core/error-handling";
import { privateProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { renameMerchantContract } from "@/shared/server-contracts/schemas/merchant";

export const renameMerchant = privateProcedure({
  schema: withZodSchema({ schema: renameMerchantContract }),
})({
  handler: async (input, { db }) => {
    // Cross-table rename in one transaction; renaming onto an existing
    // merchant merges them.
    const renameResult = await db.rpc("rename_merchant", {
      p_from: input.from,
      p_to: input.to,
    });

    if (renameResult.error) {
      console.error("Error renaming merchant:", renameResult.error);
      throw new InternalServer("Failed to rename merchant");
    }

    const counts = renameResult.data as {
      expenses_updated: number;
      recurring_updated: number;
    };

    return { code: 200 as const, data: counts };
  },
});
