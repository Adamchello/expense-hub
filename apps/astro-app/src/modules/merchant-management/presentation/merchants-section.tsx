"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/libs/ui/button";
import { Input } from "@/libs/ui/input";
import { Card, CardContent } from "@/libs/ui/card";
import { Callout, errorMessage } from "@/libs/ui/callout";
import { EmptyState } from "@/libs/ui/empty-state";
import { SkeletonList } from "@/libs/ui/skeleton";
import { apiRequest } from "@/libs/api/api-client";
import type {
  RenameMerchantInput,
  RenameMerchantResult,
} from "@/shared/server-contracts/schemas/merchant";
import { queryClient } from "@/libs/api/query-client";
import { toast } from "@/libs/ui/toast";
import { DataList, ListRow } from "@/libs/ui/data-list";
import { Amount } from "@/shared/money/amount";
import { useExpenses } from "@/modules/expense-management/core/store";

const renameMerchant = async (input: RenameMerchantInput) => {
  return apiRequest<RenameMerchantResult>("/api/merchants/rename", {
    method: "POST",
    body: input,
    fallbackError: "Failed to rename merchant",
  });
};

/**
 * Keeps payee names consistent: lists every merchant with usage counts and
 * renames it across all expenses and recurring payments (renaming onto an
 * existing merchant merges them).
 */
export function MerchantsSection() {
  const expensesQuery = useExpenses();
  const expenses = expensesQuery.data;
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const mutation = useMutation(
    {
      mutationFn: renameMerchant,
      onSuccess: (data, input) => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
        setEditing(null);
        const updated =
          (data?.data?.expenses_updated ?? 0) +
          (data?.data?.recurring_updated ?? 0);
        toast(`Renamed to "${input.to}" across ${updated} records`);
      },
    },
    queryClient,
  );

  const merchants = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();
    for (const expense of expenses ?? []) {
      const entry = stats.get(expense.provider_name) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += expense.amount;
      stats.set(expense.provider_name, entry);
    }
    return [...stats.entries()]
      .map(([name, entry]) => ({ name, ...entry }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [expenses]);

  const startEditing = (name: string) => {
    setEditing(name);
    setNewName(name);
    mutation.reset();
  };

  const submitRename = () => {
    if (!editing || !newName.trim() || newName.trim() === editing) return;
    mutation.mutate({ from: editing, to: newName.trim() });
  };

  return (
    <section
      aria-labelledby="settings-merchants"
      className="flex flex-col gap-4"
    >
      <h2 id="settings-merchants" className="sr-only">
        Merchants
      </h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Fix inconsistent payee names. A rename applies to every expense and
        recurring payment, and renaming onto an existing merchant merges the
        two.
      </p>

      {mutation.error && (
        <Callout variant="error">
          {errorMessage(mutation.error, "Failed to rename merchant")}
        </Callout>
      )}

      {expensesQuery.error && (
        <Callout variant="error">
          {errorMessage(expensesQuery.error, "Failed to load expenses")}
        </Callout>
      )}

      {expensesQuery.isLoading ? (
        <SkeletonList rows={4} />
      ) : merchants.length === 0 ? (
        <EmptyState
          title="No merchants yet"
          description="Merchants are the payees on your expenses. Record a few and they will be listed here, ready to tidy up."
        />
      ) : (
        <Card>
          <CardContent>
            <DataList>
              {merchants.map((merchant) =>
                editing === merchant.name ? (
                  <li
                    key={merchant.name}
                    className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitRename();
                        }
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                      aria-label={`New name for ${merchant.name}`}
                      className="h-8 min-w-0 flex-1 basis-40"
                    />
                    <Button
                      size="icon-sm"
                      aria-label="Confirm rename"
                      loading={mutation.isPending}
                      disabled={!newName.trim()}
                      onClick={submitRename}
                    >
                      {/* Icon-only button: the spinner stands in for the icon
                          rather than sitting beside it — both at once overflow
                          a 32px target. */}
                      {!mutation.isPending && <Check className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Cancel rename"
                      onClick={() => setEditing(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ) : (
                  <ListRow
                    key={merchant.name}
                    name={merchant.name}
                    meta={`${merchant.count} ${
                      merchant.count === 1 ? "expense" : "expenses"
                    }`}
                    value={<Amount value={merchant.total} />}
                    trailing={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Rename merchant ${merchant.name}`}
                        onClick={() => startEditing(merchant.name)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                ),
              )}
            </DataList>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
