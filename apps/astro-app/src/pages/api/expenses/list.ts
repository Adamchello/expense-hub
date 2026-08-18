export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { listExpenses } from "@/server/application/procedures/expenses/list";

export const GET: APIRoute = astroAdapter(listExpenses);
