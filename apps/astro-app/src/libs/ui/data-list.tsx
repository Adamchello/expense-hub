import { cn } from "./utils";
import type { ReactNode } from "react";

/**
 * The divided vertical list used inside cards and dialogs. Five copies existed
 * with two row paddings and an inconsistent `last:pb-0`, so two of them sat
 * unevenly against their card's bottom edge. One spelling now.
 */
export function DataList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col divide-y divide-border", className)}>
      {children}
    </ul>
  );
}

interface ListRowProps {
  name: ReactNode;
  /** Sits under the name — a category chip, a frequency. */
  secondary?: ReactNode;
  /** Sits inline before the value — a date, "in 3 days". */
  meta?: ReactNode;
  /** Right-aligned figure — typically an `<Amount>`. */
  value?: ReactNode;
  /** Row-level controls. */
  trailing?: ReactNode;
}

export function ListRow({
  name,
  secondary,
  meta,
  value,
  trailing,
}: ListRowProps) {
  return (
    <li className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {secondary && <div className="mt-0.5">{secondary}</div>}
        {/* Below sm the meta drops under the name instead of competing with
            the value for the same line — at 360px the two together truncate
            the payee to nothing. */}
        {meta && (
          <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
            {meta}
          </div>
        )}
      </div>
      {meta && (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {meta}
        </span>
      )}
      {value !== undefined && (
        <span className="min-w-24 shrink-0 text-right">{value}</span>
      )}
      {trailing}
    </li>
  );
}

/** The summed strip that closes a list: "Next 30 days" ......... $412.00 */
export function ListTotal({
  label,
  value,
  emphasis = false,
  className,
}: {
  label: ReactNode;
  /** The figure — pass an `<Amount size="inherit">` so it takes this strip's scale. */
  value: ReactNode;
  /**
   * Promotes the strip from a footnote to a figure. Used where the total is
   * the reason the card exists (what you owe in the next 30 days), not just
   * the arithmetic of the rows above it.
   */
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3",
        className,
      )}
    >
      <span
        className={cn(
          emphasis
            ? "text-sm font-medium text-foreground"
            : "text-xs text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(emphasis ? "text-lg text-primary sm:text-xl" : "text-sm")}
      >
        {value}
      </span>
    </div>
  );
}
