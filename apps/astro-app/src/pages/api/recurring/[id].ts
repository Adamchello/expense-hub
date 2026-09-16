export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/infrastructure/astro";
import { updateRecurringPayment } from "@/server/application/procedures/recurring/update";
import { deleteRecurringPayment } from "@/server/application/procedures/recurring/delete";

export const PUT: APIRoute = astroAdapter(updateRecurringPayment);
export const DELETE: APIRoute = astroAdapter(deleteRecurringPayment);
