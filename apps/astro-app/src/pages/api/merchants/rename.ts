export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { renameMerchant } from "@/server/application/procedures/merchants/rename";

export const POST: APIRoute = astroAdapter(renameMerchant);
