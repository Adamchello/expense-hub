import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import { toast } from "@/libs/ui/toast";
import { AppRouter } from "@/shared/routing/app-router";
import { errorMessage } from "@/libs/ui/callout";
import { signIn, signOut, register } from "./repository";

/**
 * Sign-in, registration and sign-out as mutations, so a failed attempt stays
 * on the page as state the form can render. Native `<form action="/api/…">`
 * submissions used to navigate the browser to the endpoint itself and land the
 * person on raw JSON whenever the server said no.
 */
export function useSignIn() {
  return useMutation(
    {
      mutationFn: signIn,
      onSuccess: () => {
        window.location.assign(AppRouter.getPath("dashboard"));
      },
    },
    queryClient,
  );
}

export function useRegister() {
  return useMutation(
    {
      mutationFn: register,
      onSuccess: () => {
        window.location.assign(AppRouter.getPath("dashboard"));
      },
    },
    queryClient,
  );
}

export function useSignOut() {
  return useMutation(
    {
      mutationFn: signOut,
      onSuccess: () => {
        window.location.assign(AppRouter.getPath("login"));
      },
      onError: (error) => {
        toast(errorMessage(error, "Could not sign out. Please try again."), {
          variant: "error",
        });
      },
    },
    queryClient,
  );
}
