export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { recurringBillSchema } from "@/lib/schemas/recurring-bill";

export const PUT: APIRoute = async (context) => {
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
    const body = await context.request.json();

    const validationResult = recurringBillSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ApiError(
        firstError.message || "Validation failed",
        400,
        validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      );
    }

    const {
      amount,
      providerName,
      description,
      category,
      frequency,
      nextDueDate,
    } = validationResult.data;

    const { data, error } = await supabase
      .from("recurring_bills")
      .update({
        amount: amount,
        provider_name: providerName,
        description: description || null,
        category: category,
        frequency: frequency,
        next_due_date: nextDueDate,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating recurring bill:", error);
      return ApiError("Failed to update recurring bill", 500, error.message);
    }

    if (!data) {
      return ApiError("Recurring bill not found", 404);
    }

    return ApiResponse(data, 200, "Recurring bill updated successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};

export const DELETE: APIRoute = async (context) => {
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
    const { data, error } = await supabase
      .from("recurring_bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error deleting recurring bill:", error);
      return ApiError("Failed to delete recurring bill", 500, error.message);
    }

    if (!data) {
      return ApiError("Recurring bill not found", 404);
    }

    return ApiResponse(data, 200, "Recurring bill deleted successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
