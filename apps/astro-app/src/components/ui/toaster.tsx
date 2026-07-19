"use client";

import { useStore } from "@nanostores/react";
import { $toasts, dismissToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

/** Global toast stack; mount once in the app shell. */
export function Toaster() {
  const toasts = useStore($toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-100 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0"
    >
      {toasts.map((entry) => (
        <div
          key={entry.id}
          role="status"
          className={cn(
            "flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-2.5 shadow-lg",
            entry.variant === "error"
              ? "border-destructive/30"
              : "border-border",
          )}
        >
          {entry.variant === "error" ? (
            <CircleAlert className="size-4.5 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className="size-4.5 shrink-0 text-green-600 dark:text-green-400" />
          )}
          <p className="min-w-0 flex-1 text-sm text-foreground">
            {entry.message}
          </p>
          {entry.undo && (
            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                entry.undo?.();
                dismissToast(entry.id);
              }}
            >
              Undo
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss notification"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => dismissToast(entry.id)}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
