import { queryClient } from "../query-client";
import { $toasts } from "@/libs/ui/toast";
import { withOptimisticList } from "../optimistic-list";

interface Item {
  id: string;
  name: string;
}

const KEY = ["items"];
const mutationFn = async (name: string) => name;
const seeded: Item[] = [{ id: "1", name: "one" }];
const append = (current: Item[], name: string) => [
  ...current,
  { id: "temp", name },
];

beforeEach(() => {
  queryClient.clear();
  $toasts.set([]);
});

describe("withOptimisticList", () => {
  it("applies the change to the cache and returns the snapshot", async () => {
    queryClient.setQueryData<Item[]>(KEY, seeded);
    const options = withOptimisticList(
      { mutationFn },
      { queryKey: KEY, apply: append },
    );

    const context = await options.onMutate!("two", {} as never);

    expect(queryClient.getQueryData<Item[]>(KEY)).toEqual([
      ...seeded,
      { id: "temp", name: "two" },
    ]);
    expect(context).toEqual({ previous: seeded });
  });

  it("leaves the cache untouched when the list was never loaded", async () => {
    const options = withOptimisticList(
      { mutationFn },
      { queryKey: KEY, apply: append },
    );

    const context = await options.onMutate!("two", {} as never);

    expect(queryClient.getQueryData(KEY)).toBeUndefined();
    expect(context).toEqual({ previous: undefined });
  });

  it("restores the snapshot, toasts, and still runs the caller's onError", async () => {
    queryClient.setQueryData<Item[]>(KEY, seeded);
    const onError = vi.fn();
    const options = withOptimisticList(
      { mutationFn, onError },
      { queryKey: KEY, apply: () => [], errorMessage: "Could not save" },
    );
    const context = await options.onMutate!("two", {} as never);
    expect(queryClient.getQueryData(KEY)).toEqual([]);

    const error = new Error("boom");
    options.onError!(error, "two", context, {} as never);

    expect(queryClient.getQueryData(KEY)).toEqual(seeded);
    expect($toasts.get()).toEqual([
      expect.objectContaining({ message: "Could not save", variant: "error" }),
    ]);
    expect(onError).toHaveBeenCalledWith(error, "two", context, {});
  });

  it("stays silent on error when no message is configured", async () => {
    queryClient.setQueryData<Item[]>(KEY, []);
    const options = withOptimisticList(
      { mutationFn },
      { queryKey: KEY, apply: () => [] },
    );

    const context = await options.onMutate!("two", {} as never);
    options.onError!(new Error("boom"), "two", context, {} as never);

    expect($toasts.get()).toEqual([]);
  });

  it("invalidates the list and still runs the caller's onSettled", () => {
    queryClient.setQueryData<Item[]>(KEY, []);
    const onSettled = vi.fn();
    const options = withOptimisticList(
      { mutationFn, onSettled },
      { queryKey: KEY, apply: () => [] },
    );

    options.onSettled!("two", null, "two", { previous: [] }, {} as never);

    expect(queryClient.getQueryState(KEY)?.isInvalidated).toBe(true);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("passes the caller's onSuccess through untouched", () => {
    const onSuccess = vi.fn();
    const options = withOptimisticList(
      { mutationFn, onSuccess },
      { queryKey: KEY, apply: () => [] },
    );

    expect(options.onSuccess).toBe(onSuccess);
  });
});
