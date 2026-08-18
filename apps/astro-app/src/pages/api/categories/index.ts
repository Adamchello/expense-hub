export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { listCategories } from "@/server/application/procedures/categories/list";
import { createCategory } from "@/server/application/procedures/categories/create";

export const GET: APIRoute = astroAdapter(listCategories);
export const POST: APIRoute = astroAdapter(createCategory);
