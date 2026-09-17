/**
 * How a signed-in person is addressed and depicted. All the app knows about
 * them is an email, so every derivation here starts from that and prefers
 * saying nothing over saying something wrong.
 */

/** "Good morning" / "Good afternoon" / "Good evening", by the reader's clock. */
export const timeOfDayGreeting = (hour: number): string => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/**
 * A first name out of an email local part — "ada.lovelace@x.com" → "Ada".
 * Falls back to no name at all rather than greeting someone by a string of
 * digits or their full address.
 */
export const displayNameFrom = (email: string | undefined): string => {
  const local = email?.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0].replace(/[^a-zA-Z]/g, "");
  if (first.length < 2) return "";
  return first[0].toUpperCase() + first.slice(1).toLowerCase();
};

/**
 * The avatar's letter, or null when the email offers nothing readable. A "?"
 * where a person's initial goes reads as an error state rather than an
 * absence; callers render the app's own mark instead.
 */
export const avatarInitial = (email: string | undefined): string | null => {
  const letter = email?.trim()[0];
  return letter && /[a-zA-Z]/.test(letter) ? letter.toUpperCase() : null;
};

/** "Good morning, Ada" — or just "Good morning" when no name can be read. */
export const greetingFor = (
  email: string | undefined,
  now: Date = new Date(),
): string => {
  const name = displayNameFrom(email);
  const base = timeOfDayGreeting(now.getHours());
  return name ? `${base}, ${name}` : base;
};
