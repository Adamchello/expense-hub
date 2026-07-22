"use client";

import { SectionLabel } from "./section-label";
import { cn } from "@/lib/utils";

/**
 * The big "how much?" input that opens both money-entry forms.
 *
 * This was ~50 lines duplicated verbatim in two dialogs, including the type
 * scale — and only one copy carried the `aria-invalid` / `aria-describedby`
 * wiring. Sharing it means the accessible version is the only version.
 *
 * The field scales itself down as digits accumulate so long values never clip,
 * and the input's width tracks its content so the figure stays optically
 * centred next to the currency glyph.
 */
interface HeroAmountFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoFocus?: boolean;
  /** Marks the field invalid from a submit-level failure. */
  invalid?: boolean;
}

export function HeroAmountField({
  id,
  label,
  value,
  onChange,
  error,
  autoFocus = false,
  invalid = false,
}: HeroAmountFieldProps) {
  const length = Math.max(value.length, 4);
  const valueSize =
    length <= 7 ? "text-5xl" : length <= 10 ? "text-4xl" : "text-3xl";
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col items-center gap-1 pt-2">
      <SectionLabel as="label" htmlFor={id}>
        {label}
      </SectionLabel>
      <div className="flex w-full min-w-0 items-baseline justify-center">
        <span
          className={cn(
            "shrink-0 font-mono font-semibold text-muted-foreground",
            length <= 7 ? "text-3xl" : "text-2xl",
          )}
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          aria-invalid={error != null || invalid ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          style={{ width: `${length + 1}ch` }}
          className={cn(
            "max-w-full border-none bg-transparent text-center font-mono font-semibold tabular-nums tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            valueSize,
          )}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
