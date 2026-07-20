"use client";

import { Button } from "@/components/ui/button";
import { useAppRedirectionWhenLoggedIn } from "@/kernel/auth/use-app-redirection-when-logged-in";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  useAppRedirectionWhenLoggedIn();

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <form action="/api/auth/signin" method="post">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-xl font-bold">
                  Welcome to Smart Expense Assistant
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
      </div>
    </div>
  );
}
