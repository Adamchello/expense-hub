export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { recurringPaymentSchema } from "@/lib/schemas/recurring-payment";

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
    return ApiError("Recurring payment id is required", 400);
  }

  try {
    const body = await context.request.json();

    const validationResult = recurringPaymentSchema.safeParse(body);

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
      .from("recurring_payments")
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
      console.error("Error updating recurring payment:", error);
      return ApiError("Failed to update recurring payment", 500, error.message);
    }

    if (!data) {
      return ApiError("Recurring payment not found", 404);
    }

    return ApiResponse(data, 200, "Recurring payment updated successfully");
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
    return ApiError("Recurring payment id is required", 400);
  }

  try {
    const { data, error } = await supabase
      .from("recurring_payments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error deleting recurring payment:", error);
      return ApiError("Failed to delete recurring payment", 500, error.message);
    }

    if (!data) {
      return ApiError("Recurring payment not found", 404);
    }

    return ApiResponse(data, 200, "Recurring payment deleted successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
