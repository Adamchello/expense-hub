export const prerender = false;
import type { APIRoute } from "astro";
import { z } from "zod";
import { ApiError, ApiResponse } from "../../../lib/api-response";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";

const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, "At least one bill id is required")
    .max(500),
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
    const validationResult = bulkDeleteSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ApiError(firstError.message || "Validation failed", 400);
    }

    const { ids } = validationResult.data;

    const { data, error } = await supabase
      .from("bills")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      console.error("Error bulk-deleting bills:", error);
      return ApiError("Failed to delete bills", 500, error.message);
    }

    return ApiResponse(
      { deleted: data?.length ?? 0 },
      200,
      `Deleted ${data?.length ?? 0} bills`,
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError("Internal server error", 500);
  }
};
