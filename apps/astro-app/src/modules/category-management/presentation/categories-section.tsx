"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/libs/ui/button";
import { Input } from "@/libs/ui/input";
import { Card, CardContent } from "@/libs/ui/card";
import { EmptyState } from "@/libs/ui/empty-state";
import { SkeletonList } from "@/libs/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/libs/ui/select";
import { Callout, errorMessage } from "@/libs/ui/callout";
import { CategoryBadge } from "@/modules/category-management/presentation/category-badge";
import { DataList } from "@/libs/ui/data-list";
import {
  COLOR_PRESETS,
  PRESET_COLOR_CLASSES,
  PRESET_COLOR_HEX,
} from "@/shared/categories/colors";
import {
  useCustomCategories,
  useCreateCustomCategory,
  useDeleteCustomCategory,
} from "../core/store";
import type { CategoryColor } from "@/shared/server-contracts/schemas/category";

export function CategoriesSection() {
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("gray");

  const query = useCustomCategories();
  const createMutation = useCreateCustomCategory();
  const deleteMutation = useDeleteCustomCategory();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          setColor("gray");
        },
      },
    );
  };

  const customs = query.data ?? [];

  return (
    <section
      aria-labelledby="settings-categories"
      className="flex flex-col gap-4"
    >
      <h2 id="settings-categories" className="sr-only">
        Custom categories
      </h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Add your own categories on top of the built-in ones. They show up in
        every category picker for this profile.
      </p>

      {/* The form is the toolbar: adding a category is the one thing this
          screen is for, so it sits where Profiles keeps "New profile". */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-2"
        aria-label="Add a custom category"
      >
        <div className="flex min-w-0 flex-1 basis-44 flex-col gap-1.5 sm:flex-none">
          <label htmlFor="new-category-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="new-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daycare"
            maxLength={30}
            className="sm:w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-category-color" className="text-sm font-medium">
            Color
          </label>
          <Select
            value={color}
            onValueChange={(value) => setColor(value as CategoryColor)}
          >
            <SelectTrigger id="new-category-color" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: PRESET_COLOR_HEX[preset] }}
                    />
                    {preset}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          loading={createMutation.isPending}
          disabled={!name.trim()}
        >
          {!createMutation.isPending && <Plus className="size-4" />}
          {createMutation.isPending ? "Adding…" : "Add category"}
        </Button>
      </form>

      {createMutation.error && (
        <Callout variant="error">
          {errorMessage(createMutation.error, "Failed to create category")}
        </Callout>
      )}

      {query.error && (
        <Callout variant="error">
          {errorMessage(query.error, "Failed to load categories")}
        </Callout>
      )}

      {query.isLoading ? (
        <SkeletonList rows={3} />
      ) : customs.length === 0 ? (
        <EmptyState
          title="No custom categories yet"
          description="The built-in categories cover rent, groceries, fuel and the rest. Add one here when something you pay for does not fit."
        />
      ) : (
        <Card>
          <CardContent>
            <DataList>
              {customs.map((custom) => (
                <li
                  key={custom.id}
                  className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <CategoryBadge
                      category={custom.name}
                      colorClassName={
                        PRESET_COLOR_CLASSES[custom.color] ??
                        PRESET_COLOR_CLASSES.gray
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete category ${custom.name}`}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(custom.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </DataList>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
