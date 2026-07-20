export const prerender = false;
import type { APIRoute } from "astro";
import { suggestCategory } from "@/modules/expense-management/core/category-suggestion";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";

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
    const { providerName } = body;

    if (!providerName || typeof providerName !== "string") {
      return ApiError("Provider name is required", 400);
    }

    const suggestedCategory = suggestCategory(providerName);

    return ApiResponse({ category: suggestedCategory }, 200);
  } catch (error) {
    console.error("Error suggesting category:", error);
    return ApiError("Internal server error", 500);
  }
};
