import { Card, CardContent } from "@/libs/ui/card";
import { cn } from "@/libs/ui/utils";
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
 * should be the same size. `tone` and `emphasis` change colour, never size, for
 * the same reason.
 */
type StatTone = "default" | "accent";
type StatEmphasis = "ink" | "primary";

/**
 * The tinted surface marks a card that is *not* comparable with its siblings —
 * a name where the others hold money. Sizing them alike and colouring them
 * apart says "same rank, different kind", which is the truth.
 */
const TONE_CLASSES: Record<StatTone, string> = {
  default: "",
  accent: "bg-accent ring-accent-foreground/15",
};

/** On the tinted surface `muted-foreground` drops under 4.5:1; this does not. */
const TONE_TEXT_CLASSES: Record<StatTone, { label: string; hint: string }> = {
  default: { label: "text-muted-foreground", hint: "text-muted-foreground" },
  accent: {
    label: "text-accent-foreground",
    hint: "text-accent-foreground/90",
  },
};

/** Money reads in the brand hue; anything that isn't money stays ink. */
const EMPHASIS_CLASSES: Record<StatEmphasis, string> = {
  ink: "text-foreground",
  primary: "text-primary",
};

interface StatCardProps {
  label: string;
  /** Money should arrive as <Amount size="inherit" />; counts as a plain value. */
  value: ReactNode;
  /** One quiet line of context. Omit it rather than padding with filler. */
  hint?: ReactNode;
  /** Surface treatment. `accent` sets a card apart in kind, not in rank. */
  tone?: StatTone;
  /** Colour of the figure itself. */
  emphasis?: StatEmphasis;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  emphasis = "ink",
  className,
}: StatCardProps) {
  const text = TONE_TEXT_CLASSES[tone];

  return (
    <Card className={cn("gap-0 py-5", TONE_CLASSES[tone], className)}>
      <CardContent className="flex flex-col gap-1.5 px-5">
        <p className={cn("truncate text-sm font-medium", text.label)}>
          {label}
        </p>
        {/* tabular-nums so counts and currency both hold their columns as
            values change — figures shouldn't shuffle while you read them. */}
        <p
          className={cn(
            "truncate text-2xl font-semibold tabular-nums tracking-tight",
            EMPHASIS_CLASSES[emphasis],
          )}
        >
          {value}
        </p>
        {hint && <p className={cn("truncate text-xs", text.hint)}>{hint}</p>}
      </CardContent>
    </Card>
  );
}
