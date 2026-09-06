import type { ChangeEvent } from "react";

/**
 * The masking layer behind every money input, so a typed figure reads the same
 * way a saved one does: `332342,12` and `332342.12` both land as "332,342.12",
 * and cents never run past two digits.
 *
 * Two representations travel together:
 *
 * - **canonical** — what form state stores and `parseFloat` consumes:
 *   `"332342.12"`. Digits, one optional ".", at most two decimals.
 * - **display** — what the input shows: `"332,342.12"`. Grouping lives here
 *   and nowhere else, so no caller ever has to strip separators back out.
 */

const MAX_FRACTION_DIGITS = 2;

const digitsOnly = (value: string) => value.replace(/\D/g, "");

/**
 * Normalises anything the user can type — a pasted `"$1,284.60"`, a European
 * `"332342,12"`, an over-precise `"12.3456"` — into canonical form.
 *
 * The one genuinely ambiguous input is a comma: `"1,234"` could be one thousand
 * two hundred thirty-four or one-point-two-three-four. It is read as a thousands
 * group, because a decimal part three digits long is not a valid cents value
 * anyway — so grouping is the only reading that can be what the user meant.
 */
export function toCanonicalAmount(raw: string): string {
  const negative = raw.trimStart().startsWith("-");
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return negative ? "-" : "";

  const sign = negative ? "-" : "";
  const lastSeparator = Math.max(
    cleaned.lastIndexOf("."),
    cleaned.lastIndexOf(","),
  );
  // A comma trailed by more digits than cents can hold is grouping, not a
  // decimal point — "1,234" is 1234, and so is the half-typed "3,3234".
  const isThousandsGroup =
    cleaned[lastSeparator] === "," &&
    cleaned.length - lastSeparator - 1 > MAX_FRACTION_DIGITS;

  if (lastSeparator === -1 || isThousandsGroup) {
    return sign + stripLeadingZeros(digitsOnly(cleaned));
  }

  const whole = stripLeadingZeros(digitsOnly(cleaned.slice(0, lastSeparator)));
  const fraction = digitsOnly(cleaned.slice(lastSeparator + 1)).slice(
    0,
    MAX_FRACTION_DIGITS,
  );
  // A separator with nothing before it is a user reaching for cents first:
  // ".5" is 0.5, and showing the leading zero says so.
  return `${sign}${whole || "0"}.${fraction}`;
}

/** "332342.12" → "332,342.12". Leaves a trailing "." alone so cents can follow. */
export function formatAmountInput(canonical: string): string {
  if (!canonical) return "";
  const separator = canonical.indexOf(".");
  if (separator === -1) return group(canonical);
  return `${group(canonical.slice(0, separator))}.${canonical.slice(separator + 1)}`;
}

/**
 * Rewrites the input in place on every keystroke, then reports the canonical
 * value upward. Writing to the DOM directly rather than waiting for the render
 * matters: when the keystroke changes nothing canonical — a second ".", a
 * stray letter — React has no re-render to correct the field with.
 */
export function handleAmountInputChange(
  event: ChangeEvent<HTMLInputElement>,
  onChange: (canonical: string) => void,
): void {
  const input = event.currentTarget;
  const typed = input.value;
  const caret = input.selectionStart ?? typed.length;
  const typedBeforeCaret = typed.slice(0, caret);

  const canonical = toCanonicalAmount(typed);
  const display = formatAmountInput(canonical);

  input.value = display;
  input.setSelectionRange(
    ...caretRange(display, typedBeforeCaret, canonical.indexOf(".")),
  );

  onChange(canonical);
}

function group(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+(?=\d)/, "");
}

/**
 * Keeps the caret against the same digit it was against before grouping moved
 * the separators around, so editing mid-number does not throw you to the end.
 */
function caretRange(
  display: string,
  typedBeforeCaret: string,
  separatorIndex: number,
): [number, number] {
  // Having just typed the decimal separator, the user is aiming at the cents.
  if (/[.,]$/.test(typedBeforeCaret) && separatorIndex !== -1) {
    const position = display.indexOf(".") + 1;
    return [position, position];
  }

  const target = digitsOnly(typedBeforeCaret).length;
  if (target === 0) return [0, 0];

  let seen = 0;
  for (let index = 0; index < display.length; index++) {
    if (display[index] >= "0" && display[index] <= "9" && ++seen === target) {
      return [index + 1, index + 1];
    }
  }
  return [display.length, display.length];
}
