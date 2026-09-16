export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { renameMerchant } from "@/server/application/procedures/merchants/rename";

export const POST: APIRoute = astroAdapter(renameMerchant);
