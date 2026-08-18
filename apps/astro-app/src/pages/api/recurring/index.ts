export const prerender = false;
import type { APIRoute } from "astro";
import { astroAdapter } from "@/server/application/adapter/astro";
import { listRecurringPayments } from "@/server/application/procedures/recurring/list";
import { createRecurringPayment } from "@/server/application/procedures/recurring/create";

export const GET: APIRoute = astroAdapter(listRecurringPayments);
export const POST: APIRoute = astroAdapter(createRecurringPayment);
