import { apiRequest } from "@/libs/api/api-client";
import type { ContractIn } from "@/shared/server-contracts/infer";
import type {
  signinContract,
  registerContract,
} from "@/shared/server-contracts/schemas/auth";

export type SignInInput = ContractIn<typeof signinContract>;
export type RegisterInput = ContractIn<typeof registerContract>;

/**
 * Auth endpoints answer with a redirect on success. `fetch` follows it, so a
 * resolved promise means "signed in"; every failure arrives as a thrown
 * `ApiRequestError` carrying the server's message. Nothing here navigates —
 * the caller decides where to go once the session cookie is set.
 */
export const signIn = (input: SignInInput) =>
  apiRequest<void>("/api/auth/signin", {
    method: "POST",
    body: input,
    fallbackError: "Could not sign in. Please try again.",
  });

export const register = (input: RegisterInput) =>
  apiRequest<void>("/api/auth/register", {
    method: "POST",
    body: input,
    fallbackError: "Could not create your account. Please try again.",
  });

export const signOut = () =>
  apiRequest<void>("/api/auth/signout", {
    method: "POST",
    body: {},
    fallbackError: "Could not sign out. Please try again.",
  });
