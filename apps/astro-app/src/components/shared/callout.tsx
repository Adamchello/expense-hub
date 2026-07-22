import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { DataE2E } from "@/__e2e__/data-e2e";

/**
 * Inline status message: something failed, something worked, something needs a
 * second look.
 *
 * Success and warning finally use the theme's `--success` / `--warning` tokens
 * instead of hardcoded Tailwind greens and yellows, which had no dark-mode pair
 * and went unreadable on a dark surface.
 *
 * The accent colour rides the border and the icon; body copy stays `foreground`
 * so it always clears AA. Errors are the one exception — destructive text is a
 * convention worth keeping, and it clears AA in both themes.
 */
type CalloutVariant = "error" | "success" | "warning" | "info";

const VARIANTS: Record<
  CalloutVariant,
  { surface: string; icon: string; text: string; Icon: LucideIcon }
> = {
  error: {
    surface: "border-destructive/20 bg-destructive/10",
    icon: "text-destructive",
    text: "text-destructive",
    Icon: AlertCircle,
  },
  success: {
    surface: "border-success/25 bg-success/10",
    icon: "text-success",
    text: "text-foreground",
    Icon: CheckCircle2,
  },
  warning: {
    surface: "border-warning/30 bg-warning/10",
    icon: "text-warning",
    text: "text-foreground",
    Icon: AlertCircle,
  },
  info: {
    surface: "border-border bg-muted",
    icon: "text-muted-foreground",
    text: "text-foreground",
    Icon: Info,
  },
};

interface CalloutProps {
  variant?: CalloutVariant;
  children: ReactNode;
  /** Icons earn their place on messages the user must act on. */
  showIcon?: boolean;
  className?: string;
  "data-e2e"?: DataE2E;
}

export function Callout({
  variant = "error",
  children,
  showIcon = true,
  className,
  ...rest
}: CalloutProps) {
  const { surface, icon, text, Icon } = VARIANTS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-xl border p-3", surface, className)}
      {...rest}
    >
      <div className="flex items-start gap-2.5">
        {showIcon && (
          <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} aria-hidden />
        )}
        <div className={cn("min-w-0 flex-1 text-sm", text)}>{children}</div>
      </div>
    </div>
  );
}

/** Normalizes the `unknown` errors that react-query hands back. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
