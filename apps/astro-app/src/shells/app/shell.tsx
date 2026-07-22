import { Router } from "./router";
import { withAuth } from "@/kernel/auth/with-auth";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonDashboard } from "@/components/ui/skeleton";
import { LogIn } from "lucide-react";

const AppShell = () => {
  return <Router />;
};

/**
 * While the session resolves, show the shape of the app rather than the word
 * "loading" — the page then fills in instead of replacing itself.
 */
const VerifyingSession = () => {
  return (
    <div className="flex min-h-screen w-full flex-row bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-3 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[52px] w-full rounded-xl" />
        <div className="mt-2 flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
          <Skeleton className="h-6 w-40" />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <SkeletonDashboard />
          </div>
        </main>
      </div>
      <span className="sr-only" role="status">
        Checking your session
      </span>
    </div>
  );
};

/**
 * The one true failure state. It used to be the words "Session lost" centred on
 * an empty page with no way out — the most anxious moment in the product got
 * the least design. Now it explains what happened and offers the exit.
 */
const SessionExpired = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <LogIn className="size-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-balance text-base font-semibold">
          Your session expired
        </h1>
        <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
          Nothing was lost — every expense you recorded is safe. Sign in again
          to pick up where you left off.
        </p>
        <Button asChild className="mt-5 w-full">
          <a href="/">Sign in again</a>
        </Button>
      </div>
    </div>
  );
};

const ProtectedAppShell = withAuth(AppShell, {
  Idle: VerifyingSession,
  Unauthenticated: SessionExpired,
});

export { ProtectedAppShell as AppShell };
