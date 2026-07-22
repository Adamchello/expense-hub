import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Nothing here yet — said in a way that teaches.
 *
 * `block` owns the whole surface when a view is empty; `inline` is the quiet
 * one-liner used inside a card that has a header of its own. Previously these
 * were fifteen hand-written blocks drifting across radius, padding and border
 * style; the drift is the reason this exists.
 */
interface EmptyStateProps {
  variant?: "block" | "inline";
  icon?: LucideIcon;
  title?: string;
  /** Say what the feature does for them, not just that it's empty. */
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  variant = "block",
  icon: Icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "py-4 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {description}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
      )}
      {title && (
        <h3
          className={cn("text-balance text-base font-semibold", Icon && "mt-4")}
        >
          {title}
        </h3>
      )}
      <p
        className={cn(
          "mx-auto max-w-prose text-pretty text-sm text-muted-foreground",
          title ? "mt-1.5" : Icon && "mt-4",
        )}
      >
        {description}
      </p>
      {actions && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
