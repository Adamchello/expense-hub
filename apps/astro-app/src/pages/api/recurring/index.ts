export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { recurringBillSchema } from "@/lib/schemas/recurring-bill";

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { data: settings, error: settingsError } = await supabase
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.active_profile_id) {
      return ApiError("No active profile selected", 409);
    }

    const { data, error } = await supabase
      .from("recurring_bills")
      .select()
      .eq("profile_id", settings.active_profile_id)
      .order("next_due_date", { ascending: true });

    if (error) {
      console.error("Error listing recurring bills:", error);
      return ApiError("Failed to load recurring bills", 500, error.message);
    }

    return ApiResponse(data, 200);
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};

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

    const { data: settings, error: settingsError } = await supabase
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.active_profile_id) {
      return ApiError("No active profile selected", 409);
    }

    const { data, error } = await supabase
      .from("recurring_bills")
      .insert({
        user_id: user.id,
        profile_id: settings.active_profile_id,
        amount: amount,
        provider_name: providerName,
        description: description || null,
        category: category,
        frequency: frequency,
        next_due_date: nextDueDate,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating recurring bill:", error);
      return ApiError("Failed to save recurring bill", 500, error.message);
    }

    return ApiResponse(data, 201, "Recurring bill saved successfully");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
