import { z } from "zod";

export const expenseSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be a positive number"),
  date: z.string({ required_error: "Date is required" }).refine(
    (date) => {
      const expenseDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return !isNaN(expenseDate.getTime()) && expenseDate <= today;
    },
    {
      message: "Date must be a valid date and cannot be in the future",
    },
  ),
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
});
