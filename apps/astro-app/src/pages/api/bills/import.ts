export const prerender = false;
import type { APIRoute } from "astro";
import { z } from "zod";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { billSchema } from "@/lib/schemas/bill";

const importBillsSchema = z.object({
  bills: z.array(billSchema).min(1, "At least one bill is required"),
});

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

    const validationResult = importBillsSchema.safeParse(body);

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

    const { bills } = validationResult.data;

    const { data: settings, error: settingsError } = await supabase
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.active_profile_id) {
      return ApiError("No active profile selected", 409);
    }

    const billsToInsert = bills.map((bill) => ({
      user_id: user.id,
      profile_id: settings.active_profile_id!,
      amount: bill.amount,
      date: bill.date,
      provider_name: bill.providerName,
      description: bill.description || null,
      category: bill.category,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("bills")
      .insert(billsToInsert)
      .select();

    if (error) {
      console.error("Error importing bills:", error);
      return ApiError(
        "Failed to import bills. No bills were saved.",
        500,
        error.message,
      );
    }

    return ApiResponse(
      { imported: data?.length || 0 },
      201,
      `Successfully imported ${data?.length || 0} bills`,
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
