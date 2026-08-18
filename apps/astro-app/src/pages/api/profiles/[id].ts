export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { renameProfile } from "@/server/application/procedures/profiles/rename";
import { deleteProfile } from "@/server/application/procedures/profiles/delete";

export const PATCH: APIRoute = astroAdapter(renameProfile);
export const DELETE: APIRoute = astroAdapter(deleteProfile);
