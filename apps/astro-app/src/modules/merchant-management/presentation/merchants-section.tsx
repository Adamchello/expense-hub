"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Amount, Callout, EmptyState, errorMessage } from "@/components/shared";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import { useExpenses } from "@/modules/expense-management/core/store";
import { Check, Pencil, X } from "lucide-react";

const renameMerchant = async (input: { from: string; to: string }) => {
  const response = await fetch("/api/merchants/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to rename merchant");
  return data;
};

/**
 * Keeps payee names consistent: lists every merchant with usage counts and
 * renames it across all expenses and recurring payments (renaming onto an existing
 * merchant merges them).
 */
export function MerchantsSection() {
  const { data: expenses } = useExpenses();
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
    <Card>
      <CardHeader>
        <CardTitle>Merchants</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Rename a merchant to fix inconsistent payee names — the change applies
          to every expense and recurring payment. Renaming onto an existing
          merchant merges them.
        </p>

        {mutation.error && (
          <Callout variant="error">
            {errorMessage(mutation.error, "Failed to rename merchant")}
          </Callout>
        )}

        {merchants.length === 0 ? (
          <EmptyState
            variant="inline"
            description="No merchants yet — they appear as you record expenses."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {merchants.map((merchant) => (
              <li
                key={merchant.name}
                className="flex flex-wrap items-center gap-2 py-2 first:pt-0 last:pb-0"
              >
                {editing === merchant.name ? (
                  <>
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
                      className="h-8 w-52"
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
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{merchant.name}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Rename merchant ${merchant.name}`}
                      onClick={() => startEditing(merchant.name)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </>
                )}
                <p className="ml-auto text-xs text-muted-foreground">
                  {merchant.count}{" "}
                  {merchant.count === 1 ? "expense" : "expenses"} ·{" "}
                  <Amount
                    value={merchant.total}
                    size="sm"
                    weight="normal"
                    muted
                  />
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
