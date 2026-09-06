import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mock-server";
import { queryClient } from "@/libs/api/query-client";
import { $toasts } from "@/libs/ui/toast";
import type { Expense } from "../domain/expense";
import { useExpenseRecordActions } from "../core/use-expense-record-actions";

const expense: Expense = {
  id: "11111111-1111-4111-8111-111111111111",
  amount: 20,
  date: "2026-09-01",
  provider_name: "Netflix",
  description: null,
  category: "Entertainment",
  created_at: "2026-09-01T10:00:00.000Z",
};

const row = { ...expense, user_id: "user-1", profile_id: "profile-1" };

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  $toasts.set([]);
  queryClient.setQueryData<Expense[]>(["expenses"], [expense]);
  server.use(
    http.get("/api/expenses/list", () =>
      HttpResponse.json({ code: 200, data: [row] }),
    ),
  );
});

describe("useExpenseRecordActions", () => {
  it("keeps one dialog open at a time when handing off from edit to delete", () => {
    const { result } = renderHook(() => useExpenseRecordActions());

    act(() => result.current.openEdit(expense));
    expect(result.current.editing).toBe(expense);

    act(() => result.current.openDelete(expense));
    expect(result.current.editing).toBeNull();
    expect(result.current.deleting).toBe(expense);
  });

  it("deletes, closes the confirmation and offers undo that re-creates the expense", async () => {
    const created: unknown[] = [];
    server.use(
      http.delete("/api/expenses/:id", () =>
        HttpResponse.json({ code: 200, data: null }),
      ),
      http.post("/api/expenses/create", async ({ request }) => {
        created.push(await request.json());
        return HttpResponse.json({ code: 201, data: row }, { status: 201 });
      }),
    );

    const { result } = renderHook(() => useExpenseRecordActions());

    act(() => result.current.openDelete(expense));
    act(() => result.current.confirmDelete());

    await waitFor(() => expect(result.current.deleting).toBeNull());
    const undoToast = $toasts.get().find((t) => t.undo);
    expect(undoToast?.message).toBe("Deleted Netflix expense");

    await act(async () => {
      await undoToast!.undo!();
    });

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ providerName: "Netflix", amount: 20 });
    expect($toasts.get().map((t) => t.message)).toContain("Expense restored");
  });
});
