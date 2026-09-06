import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { gatedResponse } from "@/__tests__/gated-response";
import { server } from "@/__tests__/mock-server";
import { queryClient } from "@/libs/api/query-client";
import { $toasts } from "@/libs/ui/toast";
import type { CustomCategory } from "../domain/custom-category";
import {
  useCreateCustomCategory,
  useDeleteCustomCategory,
} from "../core/store";

const existing: CustomCategory = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Daycare",
  color: "blue",
  created_at: "2026-08-01T10:00:00.000Z",
};

/** The row as the API returns it; the domain type drops the ownership columns. */
const row = { ...existing, user_id: "user-1", profile_id: "profile-1" };

const KEY = ["custom-categories"];
const names = () =>
  queryClient.getQueryData<CustomCategory[]>(KEY)?.map((c) => c.name);

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  $toasts.set([]);
  queryClient.setQueryData<CustomCategory[]>(KEY, [existing]);
  server.use(
    http.get("/api/categories", () =>
      HttpResponse.json({ code: 200, data: [row] }),
    ),
  );
});

describe("custom category mutations are optimistic", () => {
  it("shows the new category in name order before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.post("/api/categories", async () => {
        await opened;
        return HttpResponse.json({ code: 201, data: row }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCreateCustomCategory());

    act(() => result.current.mutate({ name: "Books", color: "green" }));

    await waitFor(() => expect(names()).toEqual(["Books", "Daycare"]));
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the new category back when the server rejects it", async () => {
    server.use(
      http.post("/api/categories", () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCreateCustomCategory());

    act(() => result.current.mutate({ name: "Books", color: "green" }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(names()).toEqual(["Daycare"]);
  });

  it("removes the category before the server responds", async () => {
    const { opened, release } = gatedResponse();
    server.use(
      http.delete(`/api/categories/${existing.id}`, async () => {
        await opened;
        return HttpResponse.json({ code: 200, data: row });
      }),
    );
    const { result } = renderHook(() => useDeleteCustomCategory());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(names()).toEqual([]));
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("brings the category back and toasts when the delete fails", async () => {
    server.use(
      http.delete(`/api/categories/${existing.id}`, () =>
        HttpResponse.json({ code: 500, message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useDeleteCustomCategory());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(names()).toEqual(["Daycare"]);
    expect($toasts.get()).toEqual([
      expect.objectContaining({ variant: "error" }),
    ]);
  });
});
