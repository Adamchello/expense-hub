import { AppRouter } from "@/kernel/routing/app-router";
import { InternalServer } from "../../../core/error-handling";
import { publicProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { signoutContract } from "@/shared/server-contracts/schemas/auth";

export const signoutUser = publicProcedure({
  schema: withZodSchema({ schema: signoutContract }),
})({
  handler: async (_input, { db }) => {
    const signOutResult = await db.auth.signOut();

    if (signOutResult.error) {
      console.error("Error signing out:", signOutResult.error);
      throw new InternalServer(signOutResult.error.message);
    }

    return { code: 303 as const, location: AppRouter.getPath("login") };
  },
});
