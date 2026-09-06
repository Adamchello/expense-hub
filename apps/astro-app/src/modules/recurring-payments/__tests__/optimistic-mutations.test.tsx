import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { gatedResponse } from "@/__tests__/gated-response";
import { server } from "@/__tests__/mock-server";
import { queryClient } from "@/libs/api/query-client";
import { $toasts } from "@/libs/ui/toast";
import type {
  RecurringPayment,
  RecurringPaymentFormData,
} from "../domain/recurring-payment";
import {
  useCreateRecurringPayment,
  useDeleteRecurringPayment,
  useUpdateRecurringPayment,
} from "../core/store";

const existing: RecurringPayment = {
  id: "22222222-2222-4222-8222-222222222222",
  amount: 45,
  provider_name: "Netflix",
  description: null,
  category: "Entertainment",
  frequency: "monthly",
  next_due_date: "2026-09-20",
  created_at: "2026-08-01T10:00:00.000Z",
};

/** The row as the API returns it; the domain type drops the ownership columns. */
const row = { ...existing, user_id: "user-1", profile_id: "profile-1" };

const formData: RecurringPaymentFormData = {
  amount: 30,
  providerName: "Gym",
  description: null,
  category: "Medical",
  frequency: "monthly",
  nextDueDate: "2026-09-10",
};

const KEY = ["recurring-payments"];
const readPayments = () => queryClient.getQueryData<RecurringPayment[]>(KEY);
const providers = () => readPayments()?.map((p) => p.provider_name);

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  $toasts.set([]);
  queryClient.setQueryData<RecurringPayment[]>(KEY, [existing]);
  server.use(
    http.get("/api/recurring", () =>
      HttpResponse.json({
        code: 200,
        data: { expenses: [row], materialized: 0 },
      }),
    ),
  );
});

describe("recurring payment mutations are optimistic", () => {
  it("shows the new payment, soonest due first, before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.post("/api/recurring", async () => {
        await opened;
        return HttpResponse.json({ code: 201, data: row }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCreateRecurringPayment());

    act(() => result.current.mutate(formData));

    await waitFor(() => expect(providers()).toEqual(["Gym", "Netflix"]));
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the new payment back when the server rejects it", async () => {
    server.use(
      http.post("/api/recurring", () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCreateRecurringPayment());

    act(() => result.current.mutate(formData));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(providers()).toEqual(["Netflix"]);
  });

  it("patches the edited payment in place before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.put(`/api/recurring/${existing.id}`, async () => {
        await opened;
        return HttpResponse.json({ code: 200, data: row });
      }),
    );
    const { result } = renderHook(() => useUpdateRecurringPayment());

    act(() =>
      result.current.mutate({
        id: existing.id,
        formData: { ...formData, providerName: "Netflix Premium", amount: 60 },
      }),
    );

    await waitFor(() =>
      expect(readPayments()).toEqual([
        expect.objectContaining({
          id: existing.id,
          provider_name: "Netflix Premium",
          amount: 60,
          next_due_date: "2026-09-10",
        }),
      ]),
    );
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("removes the payment before the server responds and toasts on failure", async () => {
    server.use(
      http.delete(`/api/recurring/${existing.id}`, () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useDeleteRecurringPayment());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(readPayments()).toEqual([existing]);
    expect($toasts.get()).toEqual([
      expect.objectContaining({ variant: "error" }),
    ]);
  });
});
