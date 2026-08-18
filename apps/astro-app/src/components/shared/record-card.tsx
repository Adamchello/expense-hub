"use client";

import { Amount } from "./amount";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/libs/ui/utils";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import type { DataE2E } from "@/__e2e__/data-e2e";

/**
 * One paid (or scheduled) thing: who, how much, what kind, when.
 *
 * Sits on a category-tinted wash so a list can be scanned by colour. Meta text
 * is a transparency of the ink rather than the grey token — grey on a tinted
 * surface goes muddy, a translucent ink stays in the wash's own hue.
 */
interface RecordCardProps {
  name: string;
  amount: number;
  category: string;
  /** Trailing note on the category chip, e.g. "· Monthly". */
  categorySuffix?: string;
  /** The when: a formatted date or a phrase like "Next payment Jul 21". */
  meta: string;
  note?: string | null;
  /**
   * Makes the whole card the affordance — clicking it opens the record, and
   * destructive actions live inside that dialog. This replaced a
   * hidden-until-hover ⋯ menu, which stole the amount's right edge and shifted
   * it on mouseover to reach two menu items.
   */
  onOpen?: () => void;
  /** Accessible name for the card-as-button, e.g. "Edit Netflix expense". */
  openLabel?: string;
  metaTestId?: DataE2E;
  /** Top-right marker, e.g. "Recurring". A dot renders with it. */
  flag?: string;
}

export function RecordCard({
  name,
  amount,
  category,
  categorySuffix,
  meta,
  note,
  onOpen,
  openLabel,
  metaTestId,
  flag,
}: RecordCardProps) {
  const { washClassFor } = useCategoryOptions();
  const isInteractive = !!onOpen;

  return (
    <div
      {...(isInteractive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": openLabel,
            onClick: onOpen,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            },
          }
        : {})}
      className={cn(
        "group relative rounded-xl border p-3.5",
        washClassFor(category),
        isInteractive && [
          "cursor-pointer transition-[box-shadow,transform] duration-150 ease-out-quart",
          "hover:shadow-sm active:scale-[0.995]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ],
      )}
    >
      {/* Name, then the amount on its own line. Side by side they competed:
          the payee is what you scan for, the amount is what you land on, and
          giving each its own line lets the amount carry real weight. */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {name}
        </h4>
        {flag && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {flag}
          </span>
        )}
      </div>

      <p className="mt-1 text-lg">
        <Amount value={amount} size="inherit" />
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <CategoryBadge category={category} suffix={categorySuffix} />
        <span
          className="ml-auto text-xs text-foreground/70"
          data-e2e={metaTestId}
        >
          {meta}
        </span>
      </div>

      {note && (
        <p className="mt-1.5 truncate text-xs text-foreground/70">{note}</p>
      )}
    </div>
  );
}
