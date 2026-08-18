import { z } from "zod";
import { FREQUENCIES } from "@/shared/domain/recurrence";

export const recurringPaymentSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be a positive number"),
  providerName: z
    .string({ required_error: "Provider name is required" })
    .min(1, "Provider name cannot be empty")
    .trim(),
  description: z
    .string()
    .max(100, "Description must be 100 characters or less")
    .trim()
    .optional()
    .nullable(),
  category: z.string().optional().default("Uncategorized"),
  frequency: z.enum(FREQUENCIES, {
    required_error: "Frequency is required",
    invalid_type_error:
      "Frequency must be weekly, monthly, quarterly or yearly",
  }),
  nextDueDate: z
    .string({ required_error: "Next due date is required" })
    .refine((date) => !isNaN(new Date(date).getTime()), {
      message: "Next due date must be a valid date",
    }),
});
