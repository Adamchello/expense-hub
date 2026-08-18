export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { suggestExpenseCategory } from "@/server/application/procedures/expenses/suggest-category";

export const POST: APIRoute = astroAdapter(suggestExpenseCategory);
