import { cn } from "@/lib/utils";

/**
 * The two illustrations behind the headline figures.
 *
 * Drawn in `currentColor` at low opacity rather than in fixed hex: the art has
 * to sit under a number in both themes, and a baked-in colour would either
 * glow on the dark card or vanish on the light one. Everything here is
 * decoration — `aria-hidden`, and the cards read identically without it.
 */

interface DecorProps {
  className?: string;
}

/**
 * Rolling hills under a low sun — the month card.
 *
 * `meet` rather than `slice`: the drawing is wider than the slot it lands in,
 * and slicing crops it to a featureless block of fill. Anchored bottom-right
 * so the horizon always sits on the card's edge whatever width it gets.
 */
export function HillsArt({ className }: DecorProps) {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("text-primary", className)}
      preserveAspectRatio="xMaxYMax meet"
    >
      <circle cx="176" cy="30" r="16" fill="currentColor" opacity="0.26" />

      {/* Far ridge */}
      <path
        d="M0 84c30 0 48-16 74-22s44 6 66 12 44 2 66-8h34v54H0V84Z"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Near ridge */}
      <path
        d="M0 102c34-2 56-20 84-24s46 12 70 16 56-6 86-14v40H0v-18Z"
        fill="currentColor"
        opacity="0.17"
      />

      {/* Conifers, drawn as stacked tiers rather than a stem with two ticks —
          the stroked version read as an arrow, which is the one shape a
          spending card must never accidentally draw. */}
      <g fill="currentColor" opacity="0.3">
        <path d="M74 62 62 84h24L74 62Zm0 16-16 22h32L74 78Z" />
        <path d="M158 70l-10 18h20l-10-18Zm0 13-13 19h26l-13-19Z" />
      </g>
    </svg>
  );
}

/** A potted plant — the year card. */
export function PlantArt({ className }: DecorProps) {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("text-primary", className)}
      preserveAspectRatio="xMaxYMax meet"
    >
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      >
        <path d="M80 84V34" />
        <path d="M80 62 58 40" />
        <path d="M80 52l22-20" />
        <path d="M80 74 60 62" />
        <path d="M80 68l22-12" />
      </g>
      <g fill="currentColor" opacity="0.3">
        <ellipse cx="52" cy="34" rx="13" ry="7" transform="rotate(-32 52 34)" />
        <ellipse
          cx="108"
          cy="26"
          rx="13"
          ry="7"
          transform="rotate(28 108 26)"
        />
        <ellipse cx="54" cy="58" rx="12" ry="6" transform="rotate(-16 54 58)" />
        <ellipse
          cx="107"
          cy="50"
          rx="12"
          ry="6"
          transform="rotate(14 107 50)"
        />
        <ellipse cx="80" cy="24" rx="7" ry="13" />
      </g>
      <path
        d="M56 88c0-6 11-8 24-8s24 2 24 8c0 18-11 32-24 32s-24-14-24-32Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path
        d="M56 88c0-6 11-8 24-8s24 2 24 8c0 18-11 32-24 32s-24-14-24-32Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
    </svg>
  );
}
