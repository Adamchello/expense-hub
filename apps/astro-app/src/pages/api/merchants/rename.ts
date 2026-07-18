export const prerender = false;
import type { APIRoute } from "astro";
import { z } from "zod";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";

const renameSchema = z.object({
  from: z.string().trim().min(1, "Current merchant name is required"),
  to: z.string().trim().min(1, "New merchant name is required"),
});

/**
 * Renames a merchant everywhere: all bills and recurring bills of the user
 * whose provider_name matches `from` are updated to `to`. Renaming onto an
 * existing merchant merges them.
 */
export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await context.request.json();
    const validationResult = renameSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ApiError(firstError.message || "Validation failed", 400);
    }

    const { from, to } = validationResult.data;

    if (from === to) {
      return ApiError("New name must differ from the current name", 400);
    }

    const { data: updatedBills, error: billsError } = await supabase
      .from("bills")
      .update({ provider_name: to })
      .eq("user_id", user.id)
      .eq("provider_name", from)
      .select("id");

    if (billsError) {
      console.error("Error renaming merchant on bills:", billsError);
      return ApiError("Failed to rename merchant", 500, billsError.message);
    }

    const { data: updatedRecurring, error: recurringError } = await supabase
      .from("recurring_bills")
      .update({ provider_name: to })
      .eq("user_id", user.id)
      .eq("provider_name", from)
      .select("id");

    if (recurringError) {
      console.error(
        "Error renaming merchant on recurring bills:",
        recurringError,
      );
      return ApiError(
        "Bills were renamed but recurring bills failed",
        500,
        recurringError.message,
      );
    }

    return ApiResponse(
      {
        bills_updated: updatedBills?.length ?? 0,
        recurring_updated: updatedRecurring?.length ?? 0,
      },
      200,
      "Merchant renamed",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
