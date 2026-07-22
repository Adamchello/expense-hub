import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * A single figure with its name and an optional line of context.
 *
 * Deliberately has no icon: a tinted glyph tile beside every metric is
 * decoration, and the accent colour is reserved for actions and state. The
 * number is the point, so the number is the only thing that gets to be big.
 *
 * `tone="lead"` promotes the one metric that matters most on a screen, so a
 * row of stats reads as a hierarchy instead of four interchangeable boxes.
 */
interface StatCardProps {
  label: string;
  /** Money should arrive as <Amount size="inherit" />; counts as a plain value. */
  value: ReactNode;
  /** One quiet line of context. Omit it rather than padding with filler. */
  hint?: ReactNode;
  tone?: "default" | "lead";
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: StatCardProps) {
  const isLead = tone === "lead";

  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="flex flex-col gap-1.5 px-5">
        <p className="truncate text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "truncate font-semibold tracking-tight text-foreground",
            isLead ? "text-3xl sm:text-4xl" : "text-2xl",
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
