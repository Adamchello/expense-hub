"use client";

import type { FormEvent } from "react";
import { Button } from "@/libs/ui/button";
import { useAppRedirectionWhenLoggedIn } from "@/shared/auth/use-app-redirection-when-logged-in";
import { useRegister } from "@/shared/auth/mutations";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from "@/libs/ui/field";
import { Callout, errorMessage } from "@/libs/ui/callout";
import { cn } from "@/libs/ui/utils";
import { Input } from "@/libs/ui/input";
import { AppRouter } from "@/shared/routing/app-router";

export function RegisterForm() {
  useAppRedirectionWhenLoggedIn();
  const register = useRegister();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    register.mutate({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-balance text-xl font-bold">
                  Start tracking your expenses
                </h1>
                <FieldDescription>
                  Already have an account?{" "}
                  <a href={AppRouter.getPath("login")}>Sign in</a>
                </FieldDescription>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  required
                />
              </Field>
              {register.isError && (
                <Callout variant="error">
                  {errorMessage(
                    register.error,
                    "Could not create your account. Please try again.",
                  )}
                </Callout>
              )}
              <Field>
                <Button type="submit" disabled={register.isPending}>
                  {register.isPending ? "Creating account…" : "Register"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}
