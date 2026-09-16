export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { createExpense } from "@/server/application/procedures/expenses/create";

export const POST: APIRoute = astroAdapter(createExpense);
