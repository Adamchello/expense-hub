"use client";

import type { FormEvent } from "react";
import { Button } from "@/libs/ui/button";
import { useAppRedirectionWhenLoggedIn } from "@/shared/auth/use-app-redirection-when-logged-in";
import { useSignIn } from "@/shared/auth/mutations";
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

export function LoginForm() {
  useAppRedirectionWhenLoggedIn();
  const signIn = useSignIn();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    signIn.mutate({
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
                  Welcome to ExpenseHub
                </h1>
                <FieldDescription>
                  Don&apos;t have an account?{" "}
                  <a href={AppRouter.getPath("register")}>Sign up</a>
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
                  autoComplete="current-password"
                  placeholder="********"
                  required
                />
              </Field>
              {signIn.isError && (
                <Callout variant="error">
                  {errorMessage(
                    signIn.error,
                    "Could not sign in. Please try again.",
                  )}
                </Callout>
              )}
              <Field>
                <Button type="submit" disabled={signIn.isPending}>
                  {signIn.isPending ? "Signing in…" : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
        {/* Sign-in is no longer the site's front door, so it needs a way back
            out to it — otherwise the only exit from this page is the browser's
            Back button. */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <a
            href={AppRouter.getPath("home")}
            className="underline-offset-4 hover:underline"
          >
            Back to ExpenseHub
          </a>
        </p>
      </div>
    </div>
  );
}
