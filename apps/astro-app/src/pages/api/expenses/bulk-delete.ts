export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { bulkDeleteExpenses } from "@/server/application/procedures/expenses/bulk-delete";

export const POST: APIRoute = astroAdapter(bulkDeleteExpenses);
