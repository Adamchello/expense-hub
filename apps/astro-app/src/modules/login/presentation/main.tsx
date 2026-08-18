"use client";

import { Button } from "@/libs/ui/button";
import { useAppRedirectionWhenLoggedIn } from "@/kernel/auth/use-app-redirection-when-logged-in";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from "@/libs/ui/field";
import { cn } from "@/libs/ui/utils";
import { Input } from "@/libs/ui/input";
import { AppRouter } from "@/kernel/routing/app-router";

export function LoginForm() {
  useAppRedirectionWhenLoggedIn();

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <form action="/api/auth/signin" method="post">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-balance text-xl font-bold">
                  Welcome to ExpenseHub
                </h1>
                <FieldDescription>
                  Don&apos;t have an account? <a href="/register">Sign up</a>
                </FieldDescription>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
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
                  placeholder="********"
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
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
