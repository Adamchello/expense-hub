import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The small capitalised label that names a group of controls — a nav group, a
 * field cluster, a column header. Eight copies drifted between `text-[11px]`
 * and `text-xs`, `font-semibold` and `font-medium`.
 *
 * This is a *grouping* label, not a section eyebrow: it belongs above a set of
 * things, never stacked above every heading on a page.
 */
export function SectionLabel({
  children,
  className,
  as: Component = "p",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "label";
  /** Only meaningful with `as="label"`. */
  htmlFor?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
