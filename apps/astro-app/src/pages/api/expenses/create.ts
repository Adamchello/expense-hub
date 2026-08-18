export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { createExpense } from "@/server/application/procedures/expenses/create";

export const POST: APIRoute = astroAdapter(createExpense);
