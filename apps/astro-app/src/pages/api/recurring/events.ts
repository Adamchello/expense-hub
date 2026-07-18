export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";

/** Lists paid/skipped occurrence events for the active profile, optionally bounded by ?from=&to= (YYYY-MM-DD). */
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

    const url = new URL(context.request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let query = supabase
      .from("recurring_bill_events")
      .select()
      .eq("profile_id", settings.active_profile_id)
      .order("due_date", { ascending: true });

    if (from) query = query.gte("due_date", from);
    if (to) query = query.lte("due_date", to);

    const { data, error } = await query;

    if (error) {
      console.error("Error listing recurring events:", error);
      return ApiError("Failed to load occurrence events", 500, error.message);
    }

    return ApiResponse(data, 200);
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
