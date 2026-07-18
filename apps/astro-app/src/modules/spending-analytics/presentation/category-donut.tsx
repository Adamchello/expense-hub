"use client";

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
      className="size-40 shrink-0"
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
