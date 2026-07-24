import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

/**
 * "↓ 8.6% vs Apr 2025" — a change against a named baseline.
 *
 * Spending down is read as good and spending up as worth noticing, so down
 * takes the success token and up takes warning, never destructive: an expense
 * that grew is a fact about your month, not an error you committed.
 *
 * The arrow is not the only carrier of direction — the sign is spelled out in
 * the accessible label, because a glyph and a colour are both invisible to a
 * screen reader and colour alone fails anyone who cannot separate the hues.
 */
interface TrendDeltaProps {
  /** Percent change; null when there is no baseline to compare against. */
  changePct: number | null;
  /** The baseline being compared to, e.g. "Apr 2025". */
  comparisonLabel: string;
  /** Rendered when there is no baseline. Omit to render nothing at all. */
  emptyLabel?: string;
  className?: string;
}

export function TrendDelta({
  changePct,
  comparisonLabel,
  emptyLabel,
  className,
}: TrendDeltaProps) {
  if (changePct === null) {
    if (!emptyLabel) return null;
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        {emptyLabel}
      </p>
    );
  }

  const isFlat = changePct === 0;
  const isDown = changePct < 0;
  const Icon = isFlat ? Minus : isDown ? ArrowDown : ArrowUp;
  const magnitude = `${Math.abs(changePct)}%`;
  const spoken = isFlat
    ? `Unchanged versus ${comparisonLabel}`
    : `${isDown ? "Down" : "Up"} ${magnitude} versus ${comparisonLabel}`;

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums",
          isFlat && "text-muted-foreground",
          isDown && "text-success",
          // Not `text-warning`: that token is a surface fill at L 0.72 and
          // fails contrast as small text on a light card. The amber steps are
          // the same hue at a legible weight, and are what the category
          // palette already uses for coloured text.
          !isFlat && !isDown && "text-amber-600 dark:text-amber-400",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {magnitude}
      </span>
      <span className="text-xs text-muted-foreground">
        vs {comparisonLabel}
      </span>
      <span className="sr-only">{spoken}</span>
    </p>
  );
}
