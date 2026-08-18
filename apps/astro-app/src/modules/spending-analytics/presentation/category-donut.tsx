"use client";

import { Amount } from "@/shared/money/amount";
import { formatCurrency } from "@/shared/format";

export interface DonutSlice {
  name: string;
  value: number;
  share: number;
  hex: string;
}

interface CategoryDonutProps {
  slices: DonutSlice[];
  total: number;
}

const RADIUS = 60;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** ~2px visual gap between adjacent slices. */
const GAP = 2;

/**
 * Donut of category shares. Identity is carried by the adjacent labeled list
 * (and tooltips), colors follow each category's fixed hue.
 */
export function CategoryDonut({ slices, total }: CategoryDonutProps) {
  if (slices.length === 0 || total <= 0) return null;

  let offset = 0;
  const segments = slices.map((slice) => {
    const length = (slice.value / total) * CIRCUMFERENCE;
    const segment = { ...slice, length, offset };
    offset += length;
    return segment;
  });

  return (
    <svg
      role="img"
      aria-label="Spending share by category"
      viewBox="0 0 160 160"
      className="size-40 shrink-0 sm:size-44"
    >
      <g transform="rotate(-90 80 80)">
        {segments.map((segment) => (
          <circle
            key={segment.name}
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke={segment.hex}
            strokeWidth={STROKE}
            strokeDasharray={`${Math.max(segment.length - GAP, 0.5)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-segment.offset}
            className="transition-opacity hover:opacity-80"
          >
            <title>{`${segment.name}: ${formatCurrency(segment.value)} (${segment.share}%)`}</title>
          </circle>
        ))}
      </g>
      <text
        x="80"
        y="76"
        textAnchor="middle"
        className="fill-foreground font-mono text-[15px] font-semibold"
      >
        {formatCurrency(total)}
      </text>
      <text
        x="80"
        y="92"
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        total
      </text>
    </svg>
  );
}

/**
 * The donut's key: one row per slice, in the same order the ring draws them.
 *
 * A bar per row was the earlier spelling, but the ring already answers "how big
 * a slice" — repeating it as a bar states the same fact twice in one card. The
 * swatch only has to tie the row to its arc, so a dot does the job and the
 * figures get the room the bars were using.
 */
export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  if (slices.length === 0) return null;

  return (
    <ul className="flex w-full flex-col gap-2.5">
      {slices.map((slice) => (
        <li key={slice.name} className="flex items-center gap-2.5 text-sm">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: slice.hex }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-foreground">
            {slice.name}
          </span>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {slice.share}%
          </span>
          <span className="w-20 shrink-0 text-right">
            <Amount value={slice.value} size="sm" weight="normal" muted />
          </span>
        </li>
      ))}
    </ul>
  );
}
