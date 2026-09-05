export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { extractExpenses } from "@/server/application/procedures/expenses/extract";

export const POST: APIRoute = astroAdapter(extractExpenses);
