import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { gatedResponse } from "@/libs/api/__tests__/gated-response";
import { server } from "@/__tests__/mock-server";
import { queryClient } from "@/libs/api/query-client";
import { $toasts } from "@/libs/ui/toast";
import type { Expense } from "../domain/expense";
import {
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "../core/store";

const existing: Expense = {
  id: "11111111-1111-4111-8111-111111111111",
  amount: 20,
  date: "2026-09-01",
  provider_name: "Existing",
  description: null,
  category: "Groceries",
  created_at: "2026-09-01T10:00:00.000Z",
};

/** The row as the API returns it; the domain type drops the ownership columns. */
const row = { ...existing, user_id: "user-1", profile_id: "profile-1" };

const formData = {
  amount: 12.5,
  date: "2026-09-05",
  providerName: "Lidl",
  description: null,
  category: "Groceries" as const,
};

const readExpenses = () => queryClient.getQueryData<Expense[]>(["expenses"]);
const providers = () => readExpenses()?.map((e) => e.provider_name);

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  $toasts.set([]);
  queryClient.setQueryData<Expense[]>(["expenses"], [existing]);
  server.use(
    http.get("/api/expenses/list", () =>
      HttpResponse.json({ code: 200, data: [row] }),
    ),
  );
});

describe("expense mutations are optimistic", () => {
  it("shows the new expense, newest date first, before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.post("/api/expenses/create", async () => {
        await opened;
        return HttpResponse.json({ code: 201, data: row }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCreateExpense());

    act(() => result.current.mutate(formData));

    await waitFor(() => expect(providers()).toEqual(["Lidl", "Existing"]));
    expect(result.current.isPending).toBe(true);
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the new expense back when the server rejects it", async () => {
    server.use(
      http.post("/api/expenses/create", () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCreateExpense());

    act(() => result.current.mutate(formData));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(providers()).toEqual(["Existing"]);
  });

  it("patches the edited expense in place before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.put(`/api/expenses/${existing.id}`, async () => {
        await opened;
        return HttpResponse.json({ code: 200, data: row });
      }),
    );
    const { result } = renderHook(() => useUpdateExpense());

    act(() =>
      result.current.mutate({
        id: existing.id,
        formData: { ...formData, providerName: "Renamed", amount: 99 },
      }),
    );

    await waitFor(() =>
      expect(readExpenses()).toEqual([
        expect.objectContaining({
          id: existing.id,
          provider_name: "Renamed",
          amount: 99,
          date: "2026-09-05",
        }),
      ]),
    );
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores the original expense when the update fails", async () => {
    server.use(
      http.put(`/api/expenses/${existing.id}`, () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useUpdateExpense());

    act(() =>
      result.current.mutate({
        id: existing.id,
        formData: { ...formData, providerName: "Renamed" },
      }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(readExpenses()).toEqual([existing]);
  });

  it("removes the expense before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.delete(`/api/expenses/${existing.id}`, async () => {
        await opened;
        return HttpResponse.json({ code: 200, data: row });
      }),
    );
    const { result } = renderHook(() => useDeleteExpense());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(providers()).toEqual([]));
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("brings the expense back and toasts when the delete fails", async () => {
    server.use(
      http.delete(`/api/expenses/${existing.id}`, () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useDeleteExpense());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(readExpenses()).toEqual([existing]);
    expect($toasts.get()).toEqual([
      expect.objectContaining({ variant: "error" }),
    ]);
  });
});
