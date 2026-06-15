export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { updateAccountSettingsSchema } from "@/lib/schemas/account-settings";

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return ApiError("Unauthorized", 401);
  }

  const { data, error } = await supabase
    .from("account_settings")
    .select("account_id, active_profile_id, updated_at")
    .eq("account_id", user.id)
    .maybeSingle();

  if (error) {
    return ApiError("Failed to load account settings", 500, error.message);
  }

  if (!data) {
    return ApiError("Account settings not found", 404);
  }

  return ApiResponse(data);
};

export const PATCH: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return ApiError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return ApiError("Invalid JSON body", 400);
  }

  const parsed = updateAccountSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return ApiError(first.message || "Validation failed", 422);
  }

  const { data: ownedProfile, error: ownerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.activeProfileId)
    .eq("account_id", user.id)
    .maybeSingle();

  if (ownerError) {
    return ApiError("Failed to verify profile", 500, ownerError.message);
  }

  if (!ownedProfile) {
    return ApiError("Profile does not belong to this account", 403);
  }

  const { data, error } = await supabase
    .from("account_settings")
    .update({
      active_profile_id: parsed.data.activeProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", user.id)
    .select("account_id, active_profile_id, updated_at")
    .single();

  if (error) {
    return ApiError("Failed to update account settings", 500, error.message);
  }

  return ApiResponse(data);
};
