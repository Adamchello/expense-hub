import { AppRouter } from "@/shared/routing/app-router";
import { InternalServer } from "../../../core/error-handling";
import { publicProcedure } from "../../../core/procedure";
import { withZodSchema } from "../../../adapter/zod";
import { registerContract } from "@/shared/server-contracts/schemas/auth";

export const registerUser = publicProcedure({
  schema: withZodSchema({ schema: registerContract }),
})({
  handler: async (input, { db }) => {
    const signUpResult = await db.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (signUpResult.error) {
      console.error("Error registering:", signUpResult.error);
      throw new InternalServer(signUpResult.error.message);
    }

    return { code: 303 as const, location: AppRouter.getPath("dashboard") };
  },
});
