import { cn } from "@/libs/ui/utils";
import type { ReactNode } from "react";

/**
 * The heading that opens a run of cards — "May 2026 · Total: $1,842.56".
 *
 * It reads as a heading rather than a rule with a caption: the month is
 * foreground weight and the total sits beside it in the accent, because the
 * total is the reason anyone scans a month header at all. Secondary counts
 * take the far right, where they can be ignored.
 */
export function ListGroupHeader({
  title,
  total,
  meta,
  action,
  className,
}: {
  title: ReactNode;
  /** The headline figure for the group, rendered in the accent. */
  total?: ReactNode;
  /** Right-aligned secondary detail, e.g. "8 expenses". */
  meta?: ReactNode;
  /** A control for this group only, e.g. "New recurring payment". */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}
    >
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {total && (
        <span className="text-sm font-medium text-primary">{total}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
        {action}
      </div>
    </div>
  );
}
