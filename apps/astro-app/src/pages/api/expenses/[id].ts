export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { updateExpense } from "@/server/application/procedures/expenses/update";
import { deleteExpense } from "@/server/application/procedures/expenses/delete";

export const PUT: APIRoute = astroAdapter(updateExpense);
export const DELETE: APIRoute = astroAdapter(deleteExpense);
