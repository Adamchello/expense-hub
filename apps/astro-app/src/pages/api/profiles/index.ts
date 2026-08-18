export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { listProfiles } from "@/server/application/procedures/profiles/list";
import { createProfile } from "@/server/application/procedures/profiles/create";

export const GET: APIRoute = astroAdapter(listProfiles);
export const POST: APIRoute = astroAdapter(createProfile);
