export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { deleteCategory } from "@/server/application/procedures/categories/delete";

export const DELETE: APIRoute = astroAdapter(deleteCategory);
