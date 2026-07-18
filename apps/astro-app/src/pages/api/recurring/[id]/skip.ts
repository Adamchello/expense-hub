export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { advanceDueDate, type Frequency } from "@/shared/domain/recurrence";

/**
 * Skips the current occurrence of a recurring bill: records a "skipped" event
 * and advances the next due date without creating a bill.
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

    const { error: eventError } = await supabase
      .from("recurring_bill_events")
      .insert({
        user_id: user.id,
        profile_id: template.profile_id,
        recurring_id: id,
        due_date: template.next_due_date,
        status: "skipped",
      });

    if (eventError) {
      console.error("Error recording skip:", eventError);
      return ApiError("Failed to skip bill", 500, eventError.message);
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
        "Skip was recorded but the next due date could not be advanced",
        500,
        updateError.message,
      );
    }

    return ApiResponse({ recurring: updated }, 200, "Occurrence skipped");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
