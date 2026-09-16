export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { registerUser } from "@/server/application/procedures/auth/register";

export const POST: APIRoute = astroAdapter(registerUser);
