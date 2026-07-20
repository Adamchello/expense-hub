export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { expenseSchema } from "@/lib/schemas/expense";

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
    return ApiError("Expense id is required", 400);
  }

  try {
    const body = await context.request.json();

    const validationResult = expenseSchema.safeParse(body);

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

    const { amount, date, providerName, description, category } =
      validationResult.data;

    const { data, error } = await supabase
      .from("expenses")
      .update({
        amount: amount,
        date: date,
        provider_name: providerName,
        description: description || null,
        category: category,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating expense:", error);
      return ApiError("Failed to update expense", 500, error.message);
    }

    if (!data) {
      return ApiError("Expense not found", 404);
    }

    return ApiResponse(data, 200, "Expense updated successfully");
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
    return ApiError("Expense id is required", 400);
  }

  try {
    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error deleting expense:", error);
      return ApiError("Failed to delete expense", 500, error.message);
    }

    if (!data) {
      return ApiError("Expense not found", 404);
    }

    return ApiResponse(data, 200, "Expense deleted successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
