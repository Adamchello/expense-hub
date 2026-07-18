export const prerender = false;
import type { APIRoute } from "astro";
import { z } from "zod";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { CATEGORIES } from "@/shared/configuration/category";

const customCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(30, "Name must be 30 characters or less"),
  color: z
    .enum([
      "gray",
      "red",
      "orange",
      "amber",
      "yellow",
      "green",
      "teal",
      "cyan",
      "blue",
      "indigo",
      "purple",
      "pink",
    ])
    .default("gray"),
});

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
      .from("custom_categories")
      .select()
      .eq("profile_id", settings.active_profile_id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error listing custom categories:", error);
      return ApiError("Failed to load categories", 500, error.message);
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
    const validationResult = customCategorySchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ApiError(firstError.message || "Validation failed", 400);
    }

    const { name, color } = validationResult.data;

    if (CATEGORIES.some((c) => c.toLowerCase() === name.toLowerCase())) {
      return ApiError(`"${name}" is already a built-in category`, 409);
    }

    const { data: settings, error: settingsError } = await supabase
      .from("account_settings")
      .select("active_profile_id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (settingsError || !settings?.active_profile_id) {
      return ApiError("No active profile selected", 409);
    }

    const { data, error } = await supabase
      .from("custom_categories")
      .insert({
        user_id: user.id,
        profile_id: settings.active_profile_id,
        name: name,
        color: color,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return ApiError(`Category "${name}" already exists`, 409);
      }
      console.error("Error creating custom category:", error);
      return ApiError("Failed to create category", 500, error.message);
    }

    return ApiResponse(data, 201, "Category created");
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
