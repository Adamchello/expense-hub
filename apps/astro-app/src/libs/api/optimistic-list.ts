import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { toast } from "@/libs/ui/toast";

/**
 * Make a list mutation optimistic.
 *
 * The list changes the moment the user acts, the server confirms in the
 * background, and a failure puts the previous list back. The server stays the
 * source of truth: the list is refetched once the request settles.
 *
 * Wraps the caller's own hooks rather than replacing them, so a store can
 * keep its `onSuccess` toast or `onSettled` side effect and both still run.
 */
export interface OptimisticListConfig<TItem, TVariables> {
  queryKey: QueryKey;
  /** Produce the list as it should look once the mutation succeeds. */
  apply: (current: TItem[], variables: TVariables) => TItem[];
  /**
   * Error toast shown on rollback. Leave unset when the calling surface
   * already renders the mutation error inline, so users read it once.
   */
  errorMessage?: string;
}

export interface OptimisticListSnapshot<TItem> {
  previous: TItem[] | undefined;
}

type MutationHooks<TData, TVariables, TItem> = UseMutationOptions<
  TData,
  Error,
  TVariables,
  OptimisticListSnapshot<TItem>
>;

export function withOptimisticList<TData, TVariables, TItem>(
  options: Omit<MutationHooks<TData, TVariables, TItem>, "onMutate">,
  { queryKey, apply, errorMessage }: OptimisticListConfig<TItem, TVariables>,
): MutationHooks<TData, TVariables, TItem> {
  return {
    ...options,
    onMutate: async (variables) => {
      // Stop an in-flight refetch from overwriting the optimistic list.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TItem[]>(queryKey);
      if (previous !== undefined) {
        queryClient.setQueryData<TItem[]>(queryKey, apply(previous, variables));
      }
      return { previous };
    },
    onError: (error, variables, context, mutation) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (errorMessage) {
        toast(errorMessage, { variant: "error" });
      }
      return options.onError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey });
      return options.onSettled?.(data, error, variables, context, mutation);
    },
  };
}

/** A client-side id for a row the server has not created yet. */
export const temporaryId = () => crypto.randomUUID();
