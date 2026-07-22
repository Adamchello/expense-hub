"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * Pick one of a few views.
 *
 * These are buttons with `aria-pressed`, not a `role="tablist"`. The previous
 * hand-rolled tablist announced "tab, selected" while owning no panel, had no
 * `aria-controls` and no arrow-key movement — it promised the tabs contract
 * and delivered none of it. A pressed-button group is an honest description of
 * what this actually is, and keyboard support comes free.
 */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Names the group for screen readers, e.g. "Recurring payments view". */
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex rounded-lg border border-border bg-card p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.icon && <option.icon className="size-4" aria-hidden />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
