export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { renameProfileSchema } from "@/lib/schemas/profile";

export const PATCH: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return ApiError("Unauthorized", 401);
  }

  const id = context.params.id;
  if (!id) {
    return ApiError("Profile id is required", 400);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return ApiError("Invalid JSON body", 400);
  }

  const parsed = renameProfileSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return ApiError(first.message || "Validation failed", 422);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", user.id)
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return ApiError("Profile name already exists", 409);
    }
    if (error.code === "PGRST116") {
      return ApiError("Profile not found", 404);
    }
    return ApiError("Failed to update profile", 500, error.message);
  }

  if (!data) {
    return ApiError("Profile not found", 404);
  }

  return ApiResponse(data);
};

export const DELETE: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return ApiError("Unauthorized", 401);
  }

  const id = context.params.id;
  if (!id) {
    return ApiError("Profile id is required", 400);
  }

  const { data: profiles, error: listError } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("account_id", user.id)
    .order("created_at", { ascending: true });

  if (listError) {
    return ApiError("Failed to load profiles", 500, listError.message);
  }

  const target = profiles?.find((p) => p.id === id);
  if (!target) {
    return ApiError("Profile not found", 404);
  }

  if ((profiles?.length ?? 0) <= 1) {
    return ApiError("Cannot delete the last remaining profile", 409);
  }

  const { data: settings } = await supabase
    .from("account_settings")
    .select("active_profile_id")
    .eq("account_id", user.id)
    .maybeSingle();

  if (settings?.active_profile_id === id) {
    const nextProfile = profiles!.find((p) => p.id !== id);
    if (nextProfile) {
      const { error: switchError } = await supabase
        .from("account_settings")
        .update({
          active_profile_id: nextProfile.id,
          updated_at: new Date().toISOString(),
        })
        .eq("account_id", user.id);

      if (switchError) {
        return ApiError(
          "Failed to reassign active profile",
          500,
          switchError.message,
        );
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("account_id", user.id);

  if (deleteError) {
    return ApiError("Failed to delete profile", 500, deleteError.message);
  }

  return new Response(null, { status: 204 });
};
