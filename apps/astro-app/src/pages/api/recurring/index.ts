export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { recurringBillSchema } from "@/lib/schemas/recurring-bill";
import { advanceDueDate, type Frequency } from "@/shared/domain/recurrence";

/** Safety cap: at most this many missed occurrences are back-filled per bill. */
const MAX_CATCHUP = 24;

/**
 * Subscription semantics: any occurrence whose billing date has arrived is
 * turned into a real bill automatically, and the schedule advances. Runs
 * lazily whenever the recurring list is fetched.
 */
async function materializeDueBills(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  bills: {
    id: string;
    profile_id: string;
    amount: number;
    provider_name: string;
    description: string | null;
    category: string;
    frequency: string;
    next_due_date: string;
  }[],
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  let created = 0;

  for (const bill of bills) {
    let dueDate = bill.next_due_date;
    let guard = 0;

    while (dueDate <= today && guard < MAX_CATCHUP) {
      const { data: createdBill, error: billError } = await supabase
        .from("bills")
        .insert({
          user_id: userId,
          profile_id: bill.profile_id,
          amount: bill.amount,
          date: dueDate,
          provider_name: bill.provider_name,
          description: bill.description,
          category: bill.category,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (billError) {
        console.error("Error auto-logging recurring bill:", billError);
        break;
      }

      // Occurrence record; non-fatal, the bill itself is the source of truth.
      const { error: eventError } = await supabase
        .from("recurring_bill_events")
        .insert({
          user_id: userId,
          profile_id: bill.profile_id,
          recurring_id: bill.id,
          due_date: dueDate,
          status: "paid",
          bill_id: createdBill.id,
        });
      if (eventError) {
        console.error("Error recording occurrence event:", eventError);
      }

      dueDate = advanceDueDate(dueDate, bill.frequency as Frequency);
      const { error: updateError } = await supabase
        .from("recurring_bills")
        .update({ next_due_date: dueDate })
        .eq("id", bill.id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error advancing recurring bill:", updateError);
        break;
      }

      created++;
      guard++;
    }
  }

  return created;
}

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

    const materialized = await materializeDueBills(
      supabase,
      user.id,
      data ?? [],
    );

    if (materialized === 0) {
      return ApiResponse({ bills: data, materialized: 0 }, 200);
    }

    // Re-read so advanced billing dates are reflected in the response.
    const { data: fresh, error: freshError } = await supabase
      .from("recurring_bills")
      .select()
      .eq("profile_id", settings.active_profile_id)
      .order("next_due_date", { ascending: true });

    if (freshError) {
      console.error("Error re-reading recurring bills:", freshError);
      return ApiResponse({ bills: data, materialized }, 200);
    }

    return ApiResponse({ bills: fresh, materialized }, 200);
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
