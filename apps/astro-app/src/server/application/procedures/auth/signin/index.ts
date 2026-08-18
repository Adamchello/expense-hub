import { AppRouter } from "@/shared/routing/app-router";
import { InternalServer, Unauthorized } from "../../../core/error-handling";
import { publicProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { signinContract } from "@/shared/server-contracts/schemas/auth";

export const signinUser = publicProcedure({
  schema: withZodSchema({ schema: signinContract }),
})({
  handler: async (input, { db }) => {
    const signInResult = await db.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (signInResult.error) {
      if (signInResult.error.status === 400) {
        throw new Unauthorized("Invalid email or password");
      }
      console.error("Error signing in:", signInResult.error);
      throw new InternalServer(signInResult.error.message);
    }

    return { code: 303 as const, location: AppRouter.getPath("dashboard") };
  },
});
