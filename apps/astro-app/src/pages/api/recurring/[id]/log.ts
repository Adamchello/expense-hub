export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { advanceDueDate, type Frequency } from "@/shared/domain/recurrence";

/**
 * Logs one occurrence of a recurring bill: creates a regular bill from the
 * template and advances the template's next due date by its frequency.
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

  const id = context.params.id;
  if (!id) {
    return ApiError("Recurring bill id is required", 400);
  }

  try {
    const { data: template, error: templateError } = await supabase
      .from("recurring_bills")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (templateError) {
      console.error("Error loading recurring bill:", templateError);
      return ApiError(
        "Failed to load recurring bill",
        500,
        templateError.message,
      );
    }

    if (!template) {
      return ApiError("Recurring bill not found", 404);
    }

    const today = new Date().toISOString().slice(0, 10);
    // A bill logged ahead of schedule is dated today, not in the future.
    const billDate =
      template.next_due_date <= today ? template.next_due_date : today;

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        user_id: user.id,
        profile_id: template.profile_id,
        amount: template.amount,
        date: billDate,
        provider_name: template.provider_name,
        description: template.description,
        category: template.category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (billError) {
      console.error("Error logging recurring bill:", billError);
      return ApiError("Failed to log bill", 500, billError.message);
    }

    const { data: updated, error: updateError } = await supabase
      .from("recurring_bills")
      .update({
        next_due_date: advanceDueDate(
          template.next_due_date,
          template.frequency as Frequency,
        ),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error advancing recurring bill:", updateError);
      return ApiError(
        "Bill was logged but the next due date could not be advanced",
        500,
        updateError.message,
      );
    }

    return ApiResponse({ bill, recurring: updated }, 201, "Bill logged");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
