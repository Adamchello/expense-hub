import { z } from "zod";
import { badRequest, internalServer, unauthorized } from "../errors";

const redirect = z.object({
  code: z.literal(303),
  location: z.string(),
});

export const signinContract = () =>
  z.object({
    in: z.object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Email must be a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty"),
    }),
    out: z.discriminatedUnion("code", [
      redirect,
      badRequest,
      unauthorized,
      internalServer,
    ]),
  });

export const registerContract = () =>
  z.object({
    in: z.object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Email must be a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty"),
    }),
    out: z.discriminatedUnion("code", [redirect, badRequest, internalServer]),
  });

export const signoutContract = () =>
  z.object({
    in: z.object({}),
    out: z.discriminatedUnion("code", [redirect, internalServer]),
  });
