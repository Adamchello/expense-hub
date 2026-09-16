export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { signoutUser } from "@/server/application/procedures/auth/signout";

export const POST: APIRoute = astroAdapter(signoutUser);
