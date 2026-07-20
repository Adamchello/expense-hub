export interface ParsedAmount {
  value: number | null;
  error: string | null;
}

export function parseAmount(value: string): ParsedAmount {
  if (!value || value.trim() === "") {
    return { value: null, error: "Amount is required" };
  }

  let cleaned = value
    .trim()
    .replace(/[$€£¥₹]/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/\.(?=.*\.)/g, "");

  // Handle negative values in parentheses
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = "-" + cleaned.slice(1, -1);
  }

  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return { value: null, error: "Invalid amount format" };
  }

  if (num <= 0) {
    return { value: null, error: "Amount must be a positive number" };
  }

  return { value: num, error: null };
}
