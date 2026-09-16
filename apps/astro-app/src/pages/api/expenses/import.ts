export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { importExpenses } from "@/server/application/procedures/expenses/import";

export const POST: APIRoute = astroAdapter(importExpenses);
