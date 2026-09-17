import type { Frequency } from "@/shared/server-contracts/base/recurring-payment";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
