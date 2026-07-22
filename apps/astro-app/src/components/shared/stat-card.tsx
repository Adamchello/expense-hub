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
 * Every card carries the same weight. A "lead" variant that enlarged one metric
 * existed briefly and read as noise — sibling figures you're meant to compare
 * should be the same size.
 */
interface StatCardProps {
  label: string;
  /** Money should arrive as <Amount size="inherit" />; counts as a plain value. */
  value: ReactNode;
  /** One quiet line of context. Omit it rather than padding with filler. */
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="flex flex-col gap-1.5 px-5">
        <p className="truncate text-sm font-medium text-muted-foreground">
          {label}
        </p>
        {/* tabular-nums so counts and currency both hold their columns as
            values change — figures shouldn't shuffle while you read them. */}
        <p className="truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {hint && (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
