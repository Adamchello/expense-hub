import { cn } from "@/lib/utils";
import { formatCurrency } from "@/shared/format";

/**
 * The single money treatment. Mono + tabular figures so columns of amounts
 * line up and digits never jitter as values change.
 *
 * Mono means MONEY here — plain counts ("4 categories") render in the sans
 * face, because monospacing a quantity is noise, not information.
 */
type AmountSize = "sm" | "md" | "lg" | "inherit";

const SIZE_CLASSES: Record<AmountSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg sm:text-2xl",
  // Takes the size from whatever slot it lands in (e.g. StatCard's value).
  inherit: "",
};

interface AmountProps {
  value: number;
  size?: AmountSize;
  /** Recede to secondary text colour; the value is context, not the headline. */
  muted?: boolean;
  /** Amounts inside a heading slot already carry their own weight. */
  weight?: "semibold" | "normal";
  className?: string;
}

export function Amount({
  value,
  size = "md",
  muted = false,
  weight = "semibold",
  className,
}: AmountProps) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-tight",
        SIZE_CLASSES[size],
        weight === "semibold" ? "font-semibold" : "font-normal",
        muted && "text-muted-foreground",
        className,
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}
