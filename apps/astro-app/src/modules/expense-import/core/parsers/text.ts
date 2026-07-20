export function parseProviderName(value: string): {
  value: string | null;
  error: string | null;
} {
  if (!value || value.trim() === "") {
    return { value: null, error: "Provider name is required" };
  }
  return { value: value.trim(), error: null };
}

export function parseDescription(value: string, maxLength = 100): string {
  if (!value) return "";
  return value.trim().substring(0, maxLength);
}
