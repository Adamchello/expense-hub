import { Amount } from "./amount";
import { cn } from "@/lib/utils";
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
  /** Sits inline before the amount — a date, "in 3 days". */
  meta?: ReactNode;
  amount?: number;
  /** Row-level controls. */
  trailing?: ReactNode;
}

export function ListRow({
  name,
  secondary,
  meta,
  amount,
  trailing,
}: ListRowProps) {
  return (
    <li className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {secondary && <div className="mt-0.5">{secondary}</div>}
      </div>
      {meta && (
        <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
      )}
      {amount !== undefined && (
        <span className="w-24 shrink-0 text-right">
          <Amount value={amount} size="md" />
        </span>
      )}
      {trailing}
    </li>
  );
}

/** The summed strip that closes a list: "Next 30 days" ......... $412.00 */
export function ListTotal({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <Amount value={value} size="md" />
    </div>
  );
}
