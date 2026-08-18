export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { getAccountSettings } from "@/server/application/procedures/account-settings/get";
import { updateAccountSettings } from "@/server/application/procedures/account-settings/update";

export const GET: APIRoute = astroAdapter(getAccountSettings);
export const PATCH: APIRoute = astroAdapter(updateAccountSettings);
