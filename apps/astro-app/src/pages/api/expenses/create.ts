export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { expenseSchema } from "@/lib/schemas/expense";

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

    const { data: settings, error: settingsError } = await supabase
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.active_profile_id) {
      return ApiError("No active profile selected", 409);
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        profile_id: settings.active_profile_id,
        amount: amount,
        date: date,
        provider_name: providerName,
        description: description || null,
        category: category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return ApiError("Failed to save expense", 500, error.message);
    }

    return ApiResponse(data, 201, "Expense saved successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
