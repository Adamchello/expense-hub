export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { signinUser } from "@/server/application/procedures/auth/signin";

export const POST: APIRoute = astroAdapter(signinUser);
