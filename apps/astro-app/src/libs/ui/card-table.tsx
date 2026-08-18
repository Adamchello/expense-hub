"use client";

import type { ReactNode } from "react";
import { cn } from "@/libs/ui/utils";

/**
 * The columnar list used inside dashboard cards: a header naming each column,
 * then rows on the same tracks.
 *
 * The tracks are declared once on the table and inherited by the header and
 * every row through `grid-cols-subgrid`. That is not a style preference — it
 * is the only way the columns actually line up. Give each row its own grid and
 * a `max-content` column sizes to *that row's* content, so every amount and
 * every date lands at a slightly different x and the table stops being a table.
 *
 * Rows therefore carry no horizontal padding: a subgrid's tracks are laid out
 * inside the item's content box, so left or right padding would shift that
 * row's columns off the shared lines.
 *
 * Built from divs with explicit ARIA table roles rather than from `<table>`
 * elements. The rows have to become two lines on a phone, which means
 * `display: grid` on the row — and changing `display` on a real `<tr>` drops
 * the implicit table semantics in every engine. Declaring the roles keeps the
 * header genuinely associated with the cells at every width.
 */
export interface CardTableColumn {
  label: string;
  /** Alignment classes for this header cell. */
  className?: string;
}

interface CardTableProps {
  /** Grid track classes, e.g. "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-…". */
  gridClassName: string;
  columns: CardTableColumn[];
  /** `CardTableRow` elements. */
  children: ReactNode;
  /** Names the table for screen readers, e.g. "Recent expenses". */
  label: string;
}

/** Every band across the table sits on the parent's tracks, not its own. */
const BAND = "col-span-full grid grid-cols-subgrid";

/**
 * The tracks shared by the dashboard's two registers — payee, a chip, a short
 * temporal note, money.
 *
 * Proportional rather than `max-content`: with content-sized trailing columns
 * the payee took every pixel of slack and the other three huddled against the
 * right edge. Fractions keep the four columns in a readable relationship at
 * any card width, and the `minmax` floors stop the chip, the date and the
 * amount from being squeezed into wrapping when the card is narrow.
 *
 * Below `sm` the row is two lines: payee and amount on the first, the chip and
 * the temporal note on the second.
 */
export const CARD_TABLE_GRID =
  "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2.2fr)_minmax(6rem,1.4fr)_minmax(5.5rem,1.1fr)_minmax(5.5rem,1.1fr)]";

export function CardTable({
  gridClassName,
  columns,
  children,
  label,
}: CardTableProps) {
  return (
    <div
      role="table"
      aria-label={label}
      className={cn("grid gap-x-3 sm:gap-x-4", gridClassName)}
    >
      {/* Hidden below sm: four column names above four rows outweigh the rows
          themselves on a phone, where each record is two lines and reads
          without them. */}
      <div
        role="row"
        className={cn(
          BAND,
          "hidden border-b border-border pb-2 text-xs font-medium text-muted-foreground sm:grid",
        )}
      >
        {columns.map((column) => (
          <span
            key={column.label}
            role="columnheader"
            className={cn("truncate", column.className)}
          >
            {column.label}
          </span>
        ))}
      </div>
      <div role="rowgroup" className={cn(BAND, "divide-y divide-border")}>
        {children}
      </div>
    </div>
  );
}

export function CardTableRow({ children }: { children: ReactNode }) {
  return (
    <div role="row" className={cn(BAND, "items-center gap-y-1 py-2.5")}>
      {children}
    </div>
  );
}

export function CardTableCell({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  /** Hover detail for a cell that summarises something longer. */
  title?: string;
}) {
  return (
    <span role="cell" className={cn("min-w-0", className)} title={title}>
      {children}
    </span>
  );
}
