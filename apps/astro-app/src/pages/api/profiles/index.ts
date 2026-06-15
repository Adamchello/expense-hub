export const prerender = false;
import type { APIRoute } from "astro";
import { ApiError, ApiResponse } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { createProfileSchema } from "@/lib/schemas/profile";

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
    .from("profiles")
    .select("id, name, created_at, updated_at")
    .eq("account_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return ApiError("Failed to load profiles", 500, error.message);
  }

  return ApiResponse(data ?? []);
};

export const POST: APIRoute = async (context) => {
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

  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return ApiError(first.message || "Validation failed", 422);
  }

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_id", user.id);

  if (countError) {
    return ApiError("Failed to verify profile limit", 500, countError.message);
  }

  if ((count ?? 0) >= 10) {
    return ApiError("Profile limit reached (max 10)", 422);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ account_id: user.id, name: parsed.data.name })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return ApiError("Profile name already exists", 409);
    }
    return ApiError("Failed to create profile", 500, error.message);
  }

  return ApiResponse(data, 201, "Profile created");
};
